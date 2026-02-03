# 📊 Visual Pattern Diagrams & Explanations

## See the Patterns, Understand the Logic

---

# PATTERN 1: TWO POINTERS

## Technique A: Opposite Direction

### Visual Representation

```
Problem: Find two numbers that sum to target in SORTED array
Array: [1, 3, 5, 7, 9, 11]  Target: 12

Step 1:
  L                    R
  ↓                    ↓
 [1,  3,  5,  7,  9,  11]
  Sum = 1 + 11 = 12 ✓ FOUND!

Another Example: Target = 10
Step 1:
  L                    R
  ↓                    ↓
 [1,  3,  5,  7,  9,  11]
  Sum = 1 + 11 = 12 > 10, move R left

Step 2:
  L               R
  ↓               ↓
 [1,  3,  5,  7,  9,  11]
  Sum = 1 + 9 = 10 ✓ FOUND!
```

### Decision Tree

```
                    ┌─────────────────┐
                    │ Calculate Sum   │
                    │ sum = L + R     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │sum < tar │  │sum == tar│  │sum > tar │
        │ Move L →│  │  FOUND!  │  │ ← Move R │
        └──────────┘  └──────────┘  └──────────┘
```

### Code Template

```java
public int[] twoSumSorted(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            return new int[]{left, right};  // Found!
        } else if (sum < target) {
            left++;   // Need bigger sum
        } else {
            right--;  // Need smaller sum
        }
    }
    return new int[]{-1, -1};  // Not found
}
```

---

## Technique B: Same Direction (Fast-Slow)

### Visual: Remove Duplicates

```
Array: [1, 1, 2, 2, 3]

Step 1:       slow
               ↓
             [1, 1, 2, 2, 3]
               ↑
              fast
              arr[slow] == arr[fast], just move fast

Step 2:       slow
               ↓
             [1, 1, 2, 2, 3]
                  ↑
                 fast
              arr[slow] != arr[fast], copy and move both

Step 3:          slow
                  ↓
             [1, 2, 2, 2, 3]
                     ↑
                    fast
              arr[slow] == arr[fast], just move fast

Step 4:          slow
                  ↓
             [1, 2, 2, 2, 3]
                        ↑
                       fast
              arr[slow] != arr[fast], copy and move both

Final:              slow
                     ↓
             [1, 2, 3, 2, 3]
                           ↑
                          fast (out of bounds)

Result: First 3 elements [1, 2, 3] are unique
```

### Code Template

```java
public int removeDuplicates(int[] arr) {
    if (arr.length == 0) return 0;

    int slow = 0;

    for (int fast = 1; fast < arr.length; fast++) {
        if (arr[fast] != arr[slow]) {
            slow++;
            arr[slow] = arr[fast];
        }
    }

    return slow + 1;  // Length of unique portion
}
```

---

# PATTERN 2: SLIDING WINDOW

## Technique A: Fixed Size Window

### Visual: Maximum Sum of K Elements

```
Array: [2, 1, 5, 1, 3, 2]  K = 3

Step 1: Calculate initial window
        ┌─────────┐
       [2,  1,  5,  1,  3,  2]
        └────┬────┘
         Sum = 8
        maxSum = 8

Step 2: Slide window
           ┌─────────┐
       [2,  1,  5,  1,  3,  2]
            └────┬────┘
         Add 1, Remove 2
         Sum = 8 + 1 - 2 = 7
        maxSum = 8

Step 3: Slide window
               ┌─────────┐
       [2,  1,  5,  1,  3,  2]
                └────┬────┘
         Add 3, Remove 1
         Sum = 7 + 3 - 1 = 9
        maxSum = 9 ✓

Step 4: Slide window
                   ┌─────────┐
       [2,  1,  5,  1,  3,  2]
                    └────┬────┘
         Add 2, Remove 5
         Sum = 9 + 2 - 5 = 6
        maxSum = 9

Result: Maximum sum = 9 (subarray [5, 1, 3])
```

### The Sliding Window Formula

```
┌─────────────────────────────────────────────────┐
│  FIXED WINDOW FORMULA                           │
│                                                 │
│  New Window = Old Window + NEW - OLD            │
│                                                 │
│      OLD        window         NEW              │
│       ↓    ┌─────────────┐      ↓               │
│      [X,   Y,   Z,   A,   B,   C]               │
│            └─────────────┘                      │
│            ↑             ↑                      │
│          start          end                     │
│                                                 │
│  windowSum += arr[end] - arr[start - 1]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Code Template

```java
public int maxSumSubarray(int[] arr, int k) {
    // Calculate first window
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }

    int maxSum = windowSum;

    // Slide the window
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];  // Add new, remove old
        maxSum = Math.max(maxSum, windowSum);
    }

    return maxSum;
}
```

---

## Technique B: Variable Size Window

### Visual: Longest Substring Without Repeating

```
String: "abcabcbb"

Step 1:  Window: "a"
         ┌─┐
        "a b c a b c b b"
         L R
         Set: {a}
         Length: 1

Step 2:  Window: "ab"
         ┌───┐
        "a b c a b c b b"
         L   R
         Set: {a, b}
         Length: 2

Step 3:  Window: "abc"
         ┌─────┐
        "a b c a b c b b"
         L     R
         Set: {a, b, c}
         Length: 3 ← MAX so far

Step 4:  'a' already in set! Shrink window
         ┌─────┐
        "a b c a b c b b"
             L R
         Remove 'a', add 'a'
         Set: {b, c, a}
         Length: 3

Step 5:  Continue...
             ┌─────┐
        "a b c a b c b b"
               L   R
         'b' already in set! Shrink...

Final Answer: 3 ("abc" or "bca" or "cab")
```

### Decision Flowchart

```
┌─────────────────────────────────────────────────────────┐
│              VARIABLE SLIDING WINDOW                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│    START: left = 0, right = 0                           │
│                                                          │
│    ┌────────────────────────────────────────┐           │
│    │  While right < array.length            │           │
│    └────────────────────┬───────────────────┘           │
│                         │                               │
│                         ▼                               │
│    ┌────────────────────────────────────────┐           │
│    │  Add arr[right] to window              │           │
│    └────────────────────┬───────────────────┘           │
│                         │                               │
│                         ▼                               │
│    ┌────────────────────────────────────────┐           │
│    │  Window valid?                         │           │
│    └──────────┬────────────────┬────────────┘           │
│               │ NO             │ YES                    │
│               ▼                ▼                        │
│    ┌──────────────────┐  ┌──────────────────┐          │
│    │  Shrink window   │  │  Update result   │          │
│    │  Remove arr[left]│  │  (max length,    │          │
│    │  left++          │  │   min length,    │          │
│    │                  │  │   etc.)          │          │
│    └────────┬─────────┘  └────────┬─────────┘          │
│             │                     │                     │
│             └──────────┬──────────┘                     │
│                        │                                │
│                        ▼                                │
│    ┌────────────────────────────────────────┐           │
│    │  right++ (expand window)               │           │
│    └────────────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Code Template

```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> set = new HashSet<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);

        // Shrink window while invalid
        while (set.contains(c)) {
            set.remove(s.charAt(left));
            left++;
        }

        // Add current character
        set.add(c);

        // Update result
        maxLen = Math.max(maxLen, right - left + 1);
    }

    return maxLen;
}
```

---

# PATTERN 3: BINARY SEARCH

## Visual: Finding Target

```
Array: [1, 3, 5, 7, 9, 11, 13]  Target: 7

Step 1:
        L           M           R
        ↓           ↓           ↓
       [1,  3,  5,  7,  9, 11, 13]
                    ↑
        mid = (0 + 6) / 2 = 3
        arr[3] = 7 == target ✓ FOUND!

Another Example: Target: 9
Step 1:
        L           M           R
        ↓           ↓           ↓
       [1,  3,  5,  7,  9, 11, 13]
        arr[3] = 7 < 9, search RIGHT

Step 2:
                        L   M   R
                        ↓   ↓   ↓
       [1,  3,  5,  7,  9, 11, 13]
        arr[5] = 11 > 9, search LEFT

Step 3:
                        L
                        M
                        R
                        ↓
       [1,  3,  5,  7,  9, 11, 13]
        arr[4] = 9 == target ✓ FOUND!
```

### Decision Tree

```
                    ┌─────────────────┐
                    │   mid = L+R/2   │
                    │   Check arr[mid]│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │arr[mid] <│  │arr[mid]==│  │arr[mid] >│
        │ target   │  │  target  │  │ target   │
        │Search →  │  │  FOUND!  │  │ ← Search │
        │L = mid+1 │  │          │  │R = mid-1 │
        └──────────┘  └──────────┘  └──────────┘
```

### Variants Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                 BINARY SEARCH VARIANTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. EXACT MATCH                                             │
│     while (left <= right)                                   │
│     if found, return mid                                    │
│                                                              │
│  2. LOWER BOUND (First >= target)                           │
│     while (left < right)                                    │
│     if (arr[mid] >= target) right = mid                     │
│     else left = mid + 1                                     │
│     return left                                             │
│                                                              │
│  3. UPPER BOUND (First > target)                            │
│     while (left < right)                                    │
│     if (arr[mid] > target) right = mid                      │
│     else left = mid + 1                                     │
│     return left                                             │
│                                                              │
│  Visual Example: [1, 2, 2, 2, 3, 4]  target = 2             │
│                                                              │
│  Lower Bound → index 1 (first 2)                            │
│  Upper Bound → index 4 (first element > 2)                  │
│  Count of 2s = Upper - Lower = 4 - 1 = 3                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# PATTERN 4: HASHMAP TECHNIQUES

## Technique A: Frequency Counting

```
Problem: Find majority element (appears > n/2 times)
Array: [2, 2, 1, 1, 1, 2, 2]

Step-by-step:
┌────┬───────┬─────────────────────────┐
│ i  │ num   │ HashMap State           │
├────┼───────┼─────────────────────────┤
│ 0  │ 2     │ {2: 1}                  │
│ 1  │ 2     │ {2: 2}                  │
│ 2  │ 1     │ {2: 2, 1: 1}            │
│ 3  │ 1     │ {2: 2, 1: 2}            │
│ 4  │ 1     │ {2: 2, 1: 3}            │
│ 5  │ 2     │ {2: 3, 1: 3}            │
│ 6  │ 2     │ {2: 4, 1: 3}            │
└────┴───────┴─────────────────────────┘

n/2 = 3.5, so need > 3 occurrences
2 appears 4 times → Majority element is 2!
```

## Technique B: Two Sum Pattern

```
Problem: Find two indices where arr[i] + arr[j] = target
Array: [2, 7, 11, 15]  Target: 9

Step-by-step:
┌────┬───────┬────────────┬───────────────────────────┐
│ i  │ num   │ complement │ HashMap / Action           │
├────┼───────┼────────────┼───────────────────────────┤
│ 0  │ 2     │ 9-2=7      │ 7 not in map. Add {2: 0}  │
│ 1  │ 7     │ 9-7=2      │ 2 IS in map! Return [0,1] │
└────┴───────┴────────────┴───────────────────────────┘

Why it works:
- We need arr[i] + arr[j] = target
- So arr[j] = target - arr[i] = complement
- If complement exists in map, we found our pair!
```

### Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│              TWO SUM HASHMAP APPROACH                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   For each number:                                       │
│                                                          │
│   ┌───────────────┐                                     │
│   │  complement = │                                     │
│   │  target - num │                                     │
│   └───────┬───────┘                                     │
│           │                                             │
│           ▼                                             │
│   ┌───────────────────────────────────────┐            │
│   │  Is complement in HashMap?            │            │
│   └────────────┬───────────────┬──────────┘            │
│                │ YES           │ NO                     │
│                ▼               ▼                        │
│   ┌────────────────────┐  ┌────────────────────┐       │
│   │ FOUND!             │  │ Add num:index      │       │
│   │ Return [map[comp], │  │ to HashMap         │       │
│   │        current_i]  │  │                    │       │
│   └────────────────────┘  └────────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

# PATTERN 5: STACK

## Monotonic Stack: Next Greater Element

```
Problem: For each element, find next greater element on the right
Array: [2, 1, 2, 4, 3]

Process RIGHT to LEFT:
┌──────┬─────────┬───────────────────────┬─────────┐
│  i   │ arr[i]  │ Stack                 │ Result  │
├──────┼─────────┼───────────────────────┼─────────┤
│  4   │   3     │ []→[3]               │   -1    │
│  3   │   4     │ [3]→pop→[4]          │   -1    │
│  2   │   2     │ [4]→[4,2]            │    4    │
│  1   │   1     │ [4,2]→[4,2,1]        │    2    │
│  0   │   2     │ [4,2,1]→pop 1→[4,2]  │    4    │
│      │         │ →pop 2→[4]→[4,2]     │         │
└──────┴─────────┴───────────────────────┴─────────┘

Final Result: [4, 2, 4, -1, -1]

Stack Rule: Pop all elements SMALLER than current
            Top of stack is next greater
```

### Visual Stack Operations

```
Processing arr = [2, 1, 2, 4, 3]

i=4, num=3:
    Stack: []
    No elements, push 3
    Stack: [3]
    Result[4] = -1 (empty before push)

i=3, num=4:
    Stack: [3]
    3 < 4, pop 3
    Stack: []
    Push 4
    Stack: [4]
    Result[3] = -1

i=2, num=2:
    Stack: [4]
    4 > 2, don't pop
    Push 2
    Stack: [4, 2]
    Result[2] = 4 (top before push)

i=1, num=1:
    Stack: [4, 2]
    2 > 1, don't pop
    Push 1
    Stack: [4, 2, 1]
    Result[1] = 2

i=0, num=2:
    Stack: [4, 2, 1]
    1 < 2, pop 1
    Stack: [4, 2]
    2 <= 2, pop 2
    Stack: [4]
    4 > 2, stop
    Push 2
    Stack: [4, 2]
    Result[0] = 4
```

---

# PATTERN 6: BFS vs DFS

## Visual Comparison on a Tree

```
Tree Structure:
              1
            / | \
           2  3  4
          /\     /\
         5  6   7  8

BFS (Level by Level):
Level 0: [1]
Level 1: [2, 3, 4]
Level 2: [5, 6, 7, 8]
Order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

DFS (Go Deep First):
Path 1: 1 → 2 → 5
Path 2: 1 → 2 → 6
Path 3: 1 → 3
Path 4: 1 → 4 → 7
Path 5: 1 → 4 → 8
Order: 1 → 2 → 5 → 6 → 3 → 4 → 7 → 8
```

## When to Use Which

```
┌─────────────────────────────────────────────────────────────┐
│                  BFS vs DFS DECISION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  USE BFS WHEN:                   USE DFS WHEN:              │
│  ─────────────                   ─────────────              │
│  • Shortest path                 • Path existence            │
│  • Level-order traversal         • All paths needed         │
│  • Nearest neighbor              • Backtracking problems    │
│  • Minimum steps/moves           • Cycle detection          │
│                                                              │
│  Example Problems:               Example Problems:          │
│  • Word Ladder                   • Number of Islands        │
│  • Rotting Oranges               • Path Sum                 │
│  • Binary Tree Level Order       • Word Search              │
│  • 01 Matrix                     • Permutations             │
│                                                              │
│  Data Structure: QUEUE           Data Structure: STACK      │
│  (or recursion)                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## BFS Template with Visual

```
┌─────────────────────────────────────────────────────────────┐
│                      BFS VISUAL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Grid:           Queue Processing:                         │
│   ┌───┬───┬───┐                                             │
│   │ S │   │   │   Step 1: Queue = [S]                       │
│   ├───┼───┼───┤   Step 2: Pop S, add neighbors → [A, B]     │
│   │ A │ B │   │   Step 3: Pop A, add neighbors → [B, C]     │
│   ├───┼───┼───┤   Step 4: Pop B, add neighbors → [C, D]     │
│   │ C │ D │ E │   Step 5: Pop C, add neighbors → [D]        │
│   └───┴───┴───┘   Step 6: Pop D, found E! → [E]             │
│                                                              │
│   S = Start, E = End                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# PATTERN 7: DYNAMIC PROGRAMMING

## Visualizing DP: Fibonacci

```
Without DP (Exponential):
                     fib(5)
                    /      \
               fib(4)       fib(3)
              /     \       /    \
          fib(3)   fib(2) fib(2) fib(1)
         /    \     ...    ...
     fib(2)  fib(1)

    Same calculations repeated many times!
    Time: O(2^n)


With DP (Memoization):
    fib(5) → check memo → not found → calculate
        fib(4) → calculate
            fib(3) → calculate
                fib(2) → calculate = 1
                fib(1) → = 1
                fib(3) = 2, store in memo
            fib(2) → CHECK MEMO → found! = 1
            fib(4) = 3, store in memo
        fib(3) → CHECK MEMO → found! = 2
        fib(5) = 5, store in memo

    Memo table: {2:1, 3:2, 4:3, 5:5}
    Time: O(n)
```

## DP Table Visualization: Longest Common Subsequence

```
String1: "ABCD"  String2: "AEBD"

     ""  A  E  B  D
  ┌────────────────────
""|  0  0  0  0  0
A |  0  1  1  1  1
B |  0  1  1  2  2
C |  0  1  1  2  2
D |  0  1  1  2  3

How to fill:
- If chars match: dp[i][j] = dp[i-1][j-1] + 1 (diagonal + 1)
- If not match:   dp[i][j] = max(dp[i-1][j], dp[i][j-1])

Example: dp[4][4] for 'D' and 'D'
- They match!
- dp[4][4] = dp[3][3] + 1 = 2 + 1 = 3

LCS = "ABD", length = 3
```

## DP Decision Framework

```
┌─────────────────────────────────────────────────────────────┐
│              IS THIS A DP PROBLEM?                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Question 1: Does it ask for OPTIMAL (min/max/count)?       │
│               │                                             │
│               ▼ YES                                         │
│   Question 2: Can the problem be broken into SUBPROBLEMS?   │
│               │                                             │
│               ▼ YES                                         │
│   Question 3: Do subproblems OVERLAP (same calculation)?    │
│               │                                             │
│               ▼ YES                                         │
│                                                              │
│           THIS IS A DP PROBLEM!                             │
│                                                              │
│   Next Steps:                                               │
│   1. Define state: dp[i] = ?                                │
│   2. Find recurrence: dp[i] = f(dp[i-1], dp[i-2], ...)     │
│   3. Identify base case: dp[0] = ?, dp[1] = ?              │
│   4. Determine order: left→right? bottom→up?               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# PATTERN 8: BACKTRACKING

## Visual: Generate All Subsets

```
Array: [1, 2, 3]

Decision Tree:
                        []
            ┌───────────┴───────────┐
          Include 1              Exclude 1
            [1]                     []
       ┌────┴────┐             ┌────┴────┐
    Inc 2     Exc 2         Inc 2     Exc 2
    [1,2]      [1]           [2]        []
    ┌──┴──┐   ┌──┴──┐       ┌──┴──┐   ┌──┴──┐
 Inc3 Exc3 Inc3 Exc3     Inc3 Exc3 Inc3 Exc3
[1,2,3][1,2][1,3] [1]   [2,3] [2]  [3]   []

All Subsets: [], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]
```

## Backtracking Template

```
┌─────────────────────────────────────────────────────────────┐
│               BACKTRACKING TEMPLATE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   void backtrack(result, current, choices, position) {       │
│       // Base case: valid solution found                    │
│       if (isComplete(current)) {                            │
│           result.add(copy(current));                        │
│           return;                                           │
│       }                                                     │
│                                                              │
│       // Try each choice                                    │
│       for (choice : choices from position) {                │
│           if (isValid(choice)) {                            │
│               // CHOOSE                                     │
│               current.add(choice);                          │
│               mark(choice);                                 │
│                                                              │
│               // EXPLORE                                    │
│               backtrack(result, current, choices, pos+1);   │
│                                                              │
│               // UN-CHOOSE (backtrack)                      │
│               current.remove(choice);                       │
│               unmark(choice);                               │
│           }                                                 │
│       }                                                     │
│   }                                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# QUICK REFERENCE: PATTERN RECOGNITION

## Problem Keywords → Pattern

```
┌────────────────────────────────────────────────────────────┐
│                  PATTERN RECOGNITION                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  KEYWORDS                          PATTERN                  │
│  ────────                          ───────                  │
│  "Sorted array"                 →  Binary Search/Two Ptr   │
│  "Contiguous subarray"          →  Sliding Window          │
│  "Substring"                    →  Sliding Window          │
│  "Sum of pairs"                 →  Two Pointers/HashMap    │
│  "In-place"                     →  Two Pointers            │
│  "Maximum/Minimum of window"    →  Sliding Window/Deque    │
│  "K elements"                   →  Heap/Sliding Window     │
│  "All permutations"             →  Backtracking            │
│  "All combinations"             →  Backtracking            │
│  "All subsets"                  →  Backtracking/Bit Mask   │
│  "Shortest path"                →  BFS                     │
│  "Number of ways"               →  DP                      │
│  "Maximum profit"               →  DP                      │
│  "Connected components"         →  DFS/Union-Find          │
│  "Cycle detection"              →  DFS/Two Pointers        │
│  "Top K / Kth largest"          →  Heap                    │
│  "Prefix/Suffix"                →  Prefix Sum Array        │
│  "Parentheses matching"         →  Stack                   │
│  "Next greater element"         →  Monotonic Stack         │
│  "Autocomplete/Search prefix"   →  Trie                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Complexity Comparison Visual

```
                    O(1)  O(log n)  O(n)  O(n log n)  O(n²)  O(2ⁿ)
n = 10               1      3       10      33       100     1024
n = 100              1      7      100     664     10000    1.3×10³⁰
n = 1000             1     10     1000    9966   1000000    ∞

Visual Growth:
O(1)       │─────────────────────────────
O(log n)   │─────────/
O(n)       │────────/
O(n log n) │──────/
O(n²)      │────/
O(2ⁿ)      │──/ ← Explodes!
           └────────────────────────────→ n
```

---

**Use these diagrams to VISUALIZE before you code!**
**Draw on paper. Trace through examples. Then write code.**
