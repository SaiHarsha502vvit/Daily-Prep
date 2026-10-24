> **Navigation**: [← SECTION 13: HACKEREARTH &…](14_Mixed_Competitive.md) | [Chapter index](00_INDEX.md) | [COMMON MISTAKES & HOW TO AVOID… →](24_Common_Mistakes.md)

# ⚡ Edge Cases Master Guide

## The Art of Thinking About Boundaries

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Common Mistakes](24_Common_Mistakes.md), [Method](01_Intro_Checklist.md) |
| **You will learn** | A catalogue of boundary conditions: empty, single, duplicates, extremes, overflow, and negative numbers |
| **Leads to** | [Common Mistakes](24_Common_Mistakes.md) |
| **Abstraction level** | Happy-path code → **code that survives the boundary** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Edge Cases

### 1. The bottom line

Most bugs live at the boundaries, so list them before you submit.

### 2. The textbook core

- Empty and single-element inputs.
- Duplicates and all-equal values.
- Minimum and maximum values.
- Negative numbers and zero.
- Off-by-one at both ends.

### 3. The real-world analogy

A **safety inspection** that tests the extremes, not the average load.

### 4. Walkthrough

1. Function: second largest of an array.
2. Test `[]`, `[1]`, `[2,2]`, `[1,2]`, `[2,1,2]`.
3. Decide what to return for each.
4. Fix the code until every case behaves.

> [!NOTE]
> **Quick check:** What is the second largest of `[2,2]`? *Undefined/none unless duplicates count — decide and document.*


### 5. Check yourself

**Q1.** What is `Integer.MAX_VALUE + 1` in Java?

<details><summary>Answer</summary>

`Integer.MIN_VALUE` (−2 147 483 648): the value wraps around.

</details>

**Q2.** What is `Math.abs(Integer.MIN_VALUE)`?

<details><summary>Answer</summary>

Still `Integer.MIN_VALUE` (negative), because +2 147 483 648 does not fit in an `int`.

</details>

---


## 📚 Part 0: Complete Understanding of Edge Cases

### What Are Edge Cases?

Edge cases are BOUNDARY CONDITIONS - the extreme or unusual inputs that
your solution must handle correctly.

💡 **ANALOGY: Building a bridge**

- Normal case: Cars crossing on a sunny day
- Edge case: What if 100 trucks cross at once?
- Edge case: What if there's an earthquake?
- Edge case: What if it's -40°C and metal contracts?
  Engineers must consider ALL conditions, not just typical ones!

**Historical Context**:

- 1996: Ariane 5 rocket explodes - integer overflow edge case
- 1999: Mars Climate Orbiter lost - unit conversion edge case
- 2020: Boeing 737 MAX - sensor edge case not handled
  Edge cases are not minor issues - they cause MAJOR failures!

### What Problem Do Edge Cases Represent

**Problem**: Humans naturally think about "TYPICAL" scenarios.
When you think "find maximum in array", your brain imagines:
[3, 7, 2, 9, 1] → Answer: 9 ✓
But what about:
[] → What's max of nothing? (empty)
[5] → Max of one element? (single)
[3, 3, 3] → All same values? (duplicates)
[-5, -3] → All negative? (negative)
[MAX_INT] → Near overflow? (boundary)
YOUR SOLUTION MUST HANDLE ALL OF THESE!

**Interview Reality**:
Interviewer tests your solution with edge cases!

- If it breaks → You didn't think through the problem
- If it handles → You think like a professional engineer

### Why Do Edge Cases Matter

1. CORRECTNESS:
   A solution that fails on edge cases is WRONG
   It only APPEARS to work on typical inputs
2. ROBUSTNESS:
   Production systems receive unexpected inputs constantly
   Users do weird things, data has anomalies
3. SECURITY:
   Hackers specifically look for edge cases to exploit
   Buffer overflow = edge case not handled
   SQL injection = special characters not handled
4. PROFESSIONALISM:
   Edge case handling separates juniors from seniors
   It shows you THINK before you code
5. INTERVIEW SUCCESS:
   Discussing edge cases shows depth of understanding
   Even if you don't solve optimally, handling edge cases impresses

### How To Develop Edge Case Thinking

THE 5-CATEGORY SYSTEM (Use for EVERY problem):

1. EMPTY / NOTHING
   "What if there's no input at all?"
   [], "", null, 0 elements
2. ONE / MINIMAL
   "What if there's just one element?"
   [5], "a", single node
3. TWO / SMALL
   "What if there are exactly two?"
   Often catches off-by-one errors
   [1, 2] vs [2, 1]
4. BOUNDARY / EXTREME
   "What about maximum/minimum possible values?"
   Integer.MAX_VALUE, Integer.MIN_VALUE, very large n
5. SPECIAL / WEIRD
   "What's the weirdest valid input?"
   All same values, all negative, sorted/reverse sorted

**Practice**: Before coding, LIST edge cases first!
Spend 2 minutes identifying them = Save 20 minutes debugging

### When To Check For Edge Cases (Timing)

BEFORE CODING (Most Important!):

- Identify all edge cases
- Decide how each should be handled
- Include them in your approach

**During Coding**:

- Add guard clauses at the start
- Check bounds before array access
- Validate inputs before processing

**After Coding**:

- Test with edge case inputs manually
- Trace through code with edge cases
- Write test cases for edge scenarios

**In Interviews**:

- Mention edge cases when explaining approach
- Ask interviewer: "Should I handle empty input?"
- After solving, say: "Let me verify with edge cases"

### Difficulties & Common Mistakes

1. FORGETTING EMPTY/NULL:
   Most common mistake! Always check first.
2. NOT CONSIDERING NEGATIVE NUMBERS:
   Many solutions assume positive inputs
3. OVERFLOW NOT DETECTED:
   int a + int b can overflow silently!
   Use long or check before adding
4. OFF-BY-ONE ERRORS:
   < vs <=, i+1 vs i, length vs length-1
   Test with arrays of size 1 and 2
5. ASSUMING ORDER:
   "Array is sorted" - is it ascending or descending?
   "Find first occurrence" - what if not present?

### Expected Outcomes

- ✅ AUTOMATIC THINKING: Identify edge cases without conscious effort
- ✅ ROBUST CODE: Solutions that work for ALL inputs
- ✅ FEWER BUGS: Catch issues before they happen
- ✅ INTERVIEW SUCCESS: Impress with thoroughness
- ✅ PROFESSIONAL QUALITY: Code ready for production

**The Transformation**:

**From**: "My solution works" (on examples I tried)

**To**: "My solution is PROVEN correct" (on all possible inputs)

---

## ❓ Part 1: Why Edge Cases Matter

```
THE STORY:
Your solution works for [1, 2, 3, 4, 5].
Does it work for []?
Does it work for [1]?
Does it work for [Integer.MAX_VALUE, Integer.MAX_VALUE]?

EDGE CASES ARE WHERE SOLUTIONS BREAK.

In interviews:
- Good solution + missed edge case = Rejected
- Okay solution + handles all edge cases = Hired

In production:
- Edge cases cause bugs
- Edge cases cause security vulnerabilities
- Edge cases cause data loss
```

---

## 📌 Part 2: Universal Edge Cases Checklist

### For ALL Problems

```
⬜ EMPTY INPUT
   - Empty array: []
   - Empty string: ""
   - Null input: null
   - Empty matrix: [][] or [[]]

⬜ SINGLE ELEMENT
   - Array with one element: [5]
   - String with one character: "a"
   - Tree with one node

⬜ TWO ELEMENTS
   - Often reveals off-by-one errors
   - [1, 2] vs [2, 1]

⬜ EXTREME VALUES
   - Integer.MAX_VALUE (2,147,483,647)
   - Integer.MIN_VALUE (-2,147,483,648)
   - Very large arrays/strings
   - Zero: 0

⬜ NEGATIVE VALUES
   - Negative numbers when positives expected
   - All negative: [-5, -3, -1]
   - Mixed: [-5, 0, 5]

⬜ DUPLICATES
   - All same: [5, 5, 5, 5]
   - Some duplicates: [1, 2, 2, 3]
   - Target is duplicate

⬜ SPECIAL VALUES
   - Zero in division problems
   - Zero in product problems
   - Infinity cases
```

---

## 📌 Part 3: Edge Cases By Data Structure

### Arrays

```java
// EDGE CASES TO TEST:
int[] empty = {};              // Length 0
int[] single = {5};            // Length 1
int[] two = {1, 2};            // Length 2 (tests pairing)
int[] sorted = {1, 2, 3, 4};   // Already sorted
int[] reverseSorted = {4, 3, 2, 1};  // Reverse sorted
int[] allSame = {7, 7, 7, 7};  // All duplicates
int[] negatives = {-5, -3, -1}; // All negative
int[] withZeros = {0, 0, 0};   // All zeros
int[] mixed = {-5, 0, 5};      // Mixed signs
int[] overflow = {Integer.MAX_VALUE, 1}; // Sum causes overflow!

// COMMON BUGS:
// 1. ArrayIndexOutOfBoundsException
//    - Accessing arr[n] when array has n elements (0 to n-1 valid)
//    - arr[i-1] when i = 0
//    - arr[i+1] when i = n-1

// 2. Off-by-one errors
//    - for (i = 0; i <= arr.length; i++)  // <= should be <
//    - Starting from 1 instead of 0
//    - Ending at n instead of n-1

// DEFENSIVE CHECK:
public int solution(int[] arr) {
    if (arr == null || arr.length == 0) {
        return -1;  // or throw exception, or return default
    }
    // Main logic
}
```

### Strings

```java
// EDGE CASES TO TEST:
String empty = "";
String single = "a";
String spaces = "   ";         // Only spaces
String specialChars = "!@#$%"; // Special characters
String mixedCase = "AbCdEf";   // Mixed upper/lower
String unicode = "日本語";      // Non-ASCII
String numeric = "12345";      // All digits
String withSpaces = "hello world";
String palindrome = "racecar";
String singleRepeated = "aaaa";

// COMMON BUGS:
// 1. NullPointerException
str.length()  // Crashes if str is null

// 2. Empty string handling
str.charAt(0)  // Crashes for empty string

// 3. String comparison
str1 == str2           // WRONG - compares references
str1.equals(str2)      // CORRECT - compares content

// 4. Substring boundary
str.substring(0, str.length() + 1)  // IndexOutOfBoundsException

// DEFENSIVE CHECK:
public String solution(String s) {
    if (s == null || s.isEmpty()) {
        return "";  // or default value
    }
    // Main logic
}
```

### Linked Lists

```java
// EDGE CASES TO TEST:
ListNode empty = null;         // Empty list
ListNode single = new ListNode(1);  // Single node
ListNode twoNodes = ...;       // Two nodes (head, head.next)
ListNode withCycle = ...;      // Cycle detection problems

// COMMON BUGS:
// 1. NullPointerException on empty list
head.val           // Crashes if head is null
head.next.val      // Crashes if only one node

// 2. Losing reference to head
head = head.next;  // Lost original head!

// 3. Not updating next pointers correctly
current.next = current.next.next;  // Skips a node

// DEFENSIVE PATTERNS:
// Use dummy node for operations that might modify head
ListNode dummy = new ListNode(0);
dummy.next = head;
// ... operations ...
return dummy.next;

// Always check before accessing .next
if (current != null && current.next != null) {
    // Safe to use current.next
}
```

### Binary Trees

```java
// EDGE CASES TO TEST:
TreeNode empty = null;           // Empty tree
TreeNode single = new TreeNode(1);  // Just root
TreeNode leftOnly = ...;         // Only left children
TreeNode rightOnly = ...;        // Only right children
TreeNode balanced = ...;         // Balanced tree
TreeNode skewed = ...;           // Completely skewed (like linked list)
TreeNode negativeVals = ...;     // Negative values in nodes

// COMMON BUGS:
// 1. NullPointerException
root.left.val       // Crashes if root.left is null

// 2. Forgetting to handle null in recursion
int height(TreeNode node) {
    return 1 + Math.max(height(node.left), height(node.right));
    // CRASHES when node is null!
}

// CORRECT:
int height(TreeNode node) {
    if (node == null) return 0;  // BASE CASE!
    return 1 + Math.max(height(node.left), height(node.right));
}

// 3. Assuming tree is complete/balanced when it might not be
```

---

## 📌 Part 4: Edge Cases By Algorithm Type

### Two Pointers

```java
// EDGE CASES:
// - Array length < 2 (can't have two pointers)
// - Both pointers at same position
// - Pointers crossing each other

// EXAMPLE: Two Sum Sorted
public int[] twoSumSorted(int[] nums, int target) {
    // Edge case: need at least 2 numbers
    if (nums == null || nums.length < 2) {
        return new int[]{-1, -1};
    }

    int left = 0, right = nums.length - 1;
    while (left < right) {  // < not <= (they shouldn't meet)
        int sum = nums[left] + nums[right];
        // Watch for overflow!
        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[]{-1, -1};  // No solution found
}
```

### Sliding Window

```java
// EDGE CASES:
// - Window size > array size
// - Window size = array size
// - Window size = 1
// - Empty array

// EXAMPLE: Max sum of k consecutive elements
public int maxSumSubarray(int[] nums, int k) {
    // Edge cases
    if (nums == null || nums.length == 0) return 0;
    if (k > nums.length) return -1;  // or sum of all
    if (k == nums.length) {
        // Return sum of entire array
        return Arrays.stream(nums).sum();
    }

    // Normal sliding window logic
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += nums[i];
    }

    int maxSum = windowSum;
    for (int i = k; i < nums.length; i++) {
        windowSum = windowSum + nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
```

### Binary Search

```java
// EDGE CASES:
// - Empty array
// - Single element
// - Target not in array
// - Target at first position
// - Target at last position
// - All elements same
// - Even vs odd length array

// EXAMPLE: Standard Binary Search
public int binarySearch(int[] nums, int target) {
    if (nums == null || nums.length == 0) return -1;

    int left = 0, right = nums.length - 1;

    while (left <= right) {
        // Avoid overflow: don't use (left + right) / 2
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;  // +1 to avoid infinite loop!
        } else {
            right = mid - 1;  // -1 to avoid infinite loop!
        }
    }

    return -1;  // Not found
}

// COMMON BUGS:
// 1. Infinite loop: forgetting +1 or -1
// 2. Overflow: (left + right) when both are large
// 3. Wrong comparison: < vs <=
```

### Recursion

```java
// EDGE CASES:
// - Base case not handled
// - Maximum recursion depth (stack overflow)
// - Negative inputs when expecting positive

// EXAMPLE: Factorial
public int factorial(int n) {
    // Edge cases
    if (n < 0) throw new IllegalArgumentException("Negative input");
    if (n > 12) {
        // n! for n > 12 overflows int
        throw new IllegalArgumentException("Result too large for int");
    }

    // Base cases
    if (n == 0 || n == 1) return 1;

    // Recursive case
    return n * factorial(n - 1);
}

// COMMON BUGS:
// 1. No base case → infinite recursion → stack overflow
// 2. Base case doesn't cover all stopping conditions
// 3. Not reducing toward base case
```

### Dynamic Programming

```java
// EDGE CASES:
// - n = 0
// - n = 1
// - Large n (overflow in calculations)
// - Negative values in array

// EXAMPLE: Climbing Stairs
public int climbStairs(int n) {
    // Edge cases
    if (n <= 0) return 0;  // Can't climb 0 or negative stairs
    if (n == 1) return 1;  // Only one way
    if (n == 2) return 2;  // Two ways: 1+1 or 2

    // Main DP logic
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}
```

---

## 📌 Part 5: Numeric Edge Cases

### Integer Overflow

```java
// DANGER ZONE:
int a = Integer.MAX_VALUE;  // 2,147,483,647
int b = a + 1;              // OVERFLOWS to -2,147,483,648!

// OVERFLOW IN COMMON OPERATIONS:
// 1. Addition
int sum = a + b;  // Can overflow
// Fix: Use long or check before adding

// 2. Multiplication
int product = a * b;  // Can overflow
// Fix: Cast to long first
long product = (long) a * b;

// 3. Array sum
int sum = 0;
for (int num : arr) {
    sum += num;  // Can overflow if many large numbers!
}
// Fix: Use long sum

// 4. Middle calculation
int mid = (left + right) / 2;  // Can overflow if both near MAX_VALUE
int mid = left + (right - left) / 2;  // SAFE!

// DETECTION:
// If result has unexpected sign change, likely overflow
```

### Division by Zero

```java
// OBVIOUS CASE:
int result = a / b;  // ArithmeticException if b = 0

// HIDDEN CASE:
int avg = sum / count;  // Crashes if count = 0

// FIX:
if (count == 0) {
    return 0;  // or throw exception, or handle appropriately
}
int avg = sum / count;

// FLOATING POINT DIVISION:
double d = 1.0 / 0.0;   // Returns Infinity (no exception!)
double d = 0.0 / 0.0;   // Returns NaN (Not a Number)
```

### Floating Point Precision

```java
// THE TRAP:
double a = 0.1 + 0.2;
System.out.println(a == 0.3);  // FALSE! a is 0.30000000000000004

// NEVER COMPARE DOUBLES WITH ==
// Instead, use epsilon comparison:
double EPSILON = 1e-9;
if (Math.abs(a - b) < EPSILON) {
    // Consider them equal
}

// FOR MONEY: Use BigDecimal, never double!
```

---

## 📌 Part 6: the Edge Case Mindset

### Before Coding

```
ASK YOURSELF:
1. What if input is empty/null?
2. What if input has only 1 element?
3. What if all elements are the same?
4. What if input is already sorted/solved?
5. What if numbers are at extremes (MAX/MIN)?
6. What if there's no valid answer?
7. What if there are multiple valid answers?
```

### After Coding

```
TEST WITH:
1. The example cases from problem
2. Empty input
3. Single element input
4. Your own edge cases from the list above
5. A "stress test" case (large but valid input)
```

### Interview Strategy

```
DURING INTERVIEW:
1. Read problem carefully
2. Ask clarifying questions:
   - "What should I return for empty input?"
   - "Can there be negative numbers?"
   - "Is the array always sorted?"
   - "Can there be duplicates?"
3. Handle edge cases FIRST in your code
4. Mention edge cases while explaining
```

---

## 📖 Part 7: Quick Reference Card

**EDGE CASE QUICK CHECK**

```text
Arrays:
□ Empty array        □ Single element     □ Two elements
□ All same           □ Sorted             □ Reverse sorted
□ Negatives          □ Zeros              □ Large values
Strings:
□ Empty ""           □ Single char        □ All spaces
□ Mixed case         □ Special chars      □ Unicode
Numbers:
□ Zero               □ One                □ Negative
□ MAX_VALUE          □ MIN_VALUE          □ Overflow possible
Trees/Graphs:
□ Null/empty         □ Single node        □ Linear (skewed)
□ Cycles             □ Disconnected       □ Negative weights
General:
□ No solution exists □ Multiple solutions □ Duplicate values
□ Boundary values    □ null input         □ Very large input
```

---

_The difference between a good programmer and a great programmer is edge case handling!_ ⚡

---


---

### Historical Evolution

Boundary-value analysis was described by Glenford Myers in *The Art of Software Testing* (1979). Famous failures show the cost of ignoring limits: Ariane 5 Flight 501 (1996) failed after a 64-bit floating-point value overflowed a 16-bit integer conversion, and the Mars Climate Orbiter (1999) was lost because one team used pound-force seconds and another newton-seconds. Joshua Bloch's 2006 note on the binary-search midpoint overflow is the standard algorithmic example.

- **Myers — 1979**: Boundary-value analysis
- **Ariane 5 — 1996**: Overflow in a numeric conversion
- **Mars Climate Orbiter — 1999**: Unit mismatch
- **Bloch — 2006**: Midpoint overflow in binary search

### Production Reality

**Edge Cases** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Empty input not guarded.** The most common production bug: functions that work correctly on n>=2 elements fail silently on n=0 or n=1. Single-element array sorting returns the same element; an algorithm expecting pairs (`for i in range(n-1)`) runs zero iterations. Illustrative impact: silent wrong results or a `NullPointerException` when the first or only element is mishandled; always test lengths 0, 1 and 2.

**Failure mode 2: Integer overflow at MAX_INT boundaries.** Adding 1 to Integer.MAX_VALUE wraps to Integer.MIN_VALUE (-2,147,483,648). In a stock trading system with portfolio value tracking, exceeding MAX_VALUE causes negative balances — trades that should be rejected are approved with negative cash. Real example: YouTube's view counter outgrew a signed 32-bit integer when a video passed 2,147,483,647 views in 2014, and YouTube moved the counter to 64 bits.

**Failure mode 3: Off-by-one boundary errors.** Loop conditions `i <= arr.length` instead of `i < arr.length` cause ArrayIndexOutOfBoundsException. In aircraft collision detection, off-by-one in boundary coordinate checks can misclassify safe proximity as collision risk or vice versa. Illustrative impact: `ArrayIndexOutOfBoundsException`, or silent memory corruption in languages without bounds checking.

**Debug workflow:** (1) Add explicit null/empty guards at function entry: `if (arr == null || arr.length == 0) return defaultValue;` (2) Test with n=0, n=1, n=2 as a baseline; (3) For arithmetic near boundaries, use `long` or `BigInteger` — never assume inputs stay below MAX_VALUE/2; (4) Add assertions in development: `assert n > 0 : "n must be positive";` (5) Use property-based testing (QuickCheck, Hypothesis) to generate boundary values automatically.

**Real-world anchor:** Heartbleed (2014) was a missing bounds check in OpenSSL's TLS heartbeat handling: the code trusted a length field supplied by the peer and copied up to 64 KB of adjacent memory into the reply. Unvalidated length and boundary inputs are the root of many security incidents.


---

## 🏢 Enterprise Lens — Edge Cases

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Code review checklists, test design |
| **Failure modes** | Assuming sorted/non-empty/positive input |
| **Testing and verification** | Table-driven tests for every listed case |

---

## Reality Check

**"Edge cases are found by imagination"** — They are found by CHECKLIST against the input grammar: for every parameter ask empty, single, two, all-same, sorted-both-ways, extremes-of-range, and (for indices) first/last/out-of-bounds. Imagination produces the edges you already suspected; the checklist produces the ones you did not. The measurable difference: checklist users find the killing edge BEFORE coding (it shapes the design), imagination users find it in the failed submission.

**"Null checks are what edge-case discipline means"** — Null is one row of a much larger table, and over-indexing on it produces defensive noise while missing the real killers: overflow at boundaries (mid computation, sum accumulation), the empty-versus-absent distinction (empty array is a VALID input with a defined answer — what is max-subarray of []?), single-element degeneracy (is one element sorted? a palindrome? an interval?), and duplicate saturation (all elements equal defeats naive two-pointer termination). Ask what the problem DEFINES for each, because half the time the statement is silent and the choice is yours to state aloud.

**"Handle edge cases with special-case code at the top"** — Guard clauses are the FALLBACK, not the goal: the stronger move is choosing formulations where edges are not special — dummy heads erase the head-mutation case, len+1 prefix arrays erase the empty-prefix case, while (l1 != null || l2 != null || carry != 0) erases the unequal-length cases. Every guard clause is a confession the main loop has a hole; sometimes that is fine, but the design that needs no confession reviews better and breaks less.

**"Integer edges are about MAX_VALUE"** — The asymmetry is the trap: MIN_VALUE has no positive counterpart, so Math.abs(MIN_VALUE) is negative, negation overflows, and reverse-integer/divide-two-integers problems place their nastiest test exactly there. Add the division duo — truncation toward zero versus floor for negatives, and the percent sign following the dividend — and you have the five-line integer-edge catechism that decides several classic problems outright.

**"Thorough edge handling means testing everything after coding"** — In interviews the sequence is inverted and PUBLIC: enumerate edges before coding (it demonstrates rigor and shapes the design), then after coding trace exactly TWO — the nastiest edge and one normal case — aloud, line by line. Testing everything is neither expected nor time-feasible; choosing the two highest-information traces is the skill being graded. In production the same triage appears as boundary-value test selection; exhaustiveness is for property-based tools, judgment is for humans.
