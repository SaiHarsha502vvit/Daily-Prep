# CORE TEMPLATES & 2-DAY ROADMAP

## 🎯 Must-Memorize Templates for Netcracker

### Template 1: Standard Input Validation

```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();

// Pattern 1: Positive only
if (n <= 0) {
    System.out.println("Invalid Input");
    return;
}

// Pattern 2: Separate ZERO and Negative
if (n == 0) {
    System.out.println("ZERO");
    return;
}
if (n < 0) {
    System.out.println("Invalid Input");
    return;
}

// Pattern 3: Range validation
if (n < MIN || n > MAX) {
    System.out.println("Invalid Input");
    return;
}
```

---

### Template 2: Array Input with Validation

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

// Optional: Validate key/window size
int k = sc.nextInt();
if (k <= 0 || k > n) {
    System.out.println("Invalid Key Value");
    return;
}
```

---

### Template 3: Prime Number Check (Optimal)

```java
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
```

**Time Complexity:** O(√N)  
**Use Case:** Q1, any prime-related problems

---

### Template 4: Fixed-Size Sliding Window

```java
// Brute Force - Easy to implement
for (int i = 0; i <= n - k; i++) {
    // Process window [i, i+k-1]
    for (int j = i; j < i + k; j++) {
        // Check arr[j]
    }
}
```

**Time Complexity:** O(N×K)  
**Use Case:** Q2, window-based problems with K < 100

---

### Template 5: Digit Extraction

```java
public static int getDigitSum(int num) {
    int sum = 0;
    num = Math.abs(num);  // Handle negatives

    while (num > 0) {
        sum += num % 10;
        num /= 10;
    }
    return sum;
}
```

**Time Complexity:** O(log₁₀N) = O(D) where D = number of digits  
**Use Case:** Q3, any digit manipulation

---

### Template 6: StringBuilder for String Building

```java
StringBuilder sb = new StringBuilder();

// Append operations
sb.append("text");
sb.append(123);
sb.append('c');

// Convert to String
String result = sb.toString();

// Other useful methods
sb.length();              // Get length
sb.charAt(i);             // Get character at index
sb.deleteCharAt(i);       // Remove character
sb.reverse();             // Reverse entire string
```

**Time Complexity:** append() is O(1) amortized  
**Use Case:** String construction, pattern printing

---

### Template 7: Recursive Backtracking

```java
public static void backtrack(int[] arr, int index,
                            ArrayList<Integer> current,
                            ArrayList<ArrayList<Integer>> result) {
    // BASE CASE: Check and store solution
    if (isValidSolution(current)) {
        result.add(new ArrayList<>(current));  // Deep copy!
    }

    // RECURSIVE CASE: Try each choice
    for (int i = index; i < arr.length; i++) {
        // MAKE CHOICE
        current.add(arr[i]);

        // RECURSE with remaining elements
        backtrack(arr, i + 1, current, result);

        // UNDO CHOICE (backtrack)
        current.remove(current.size() - 1);
    }
}
```

**Time Complexity:** O(2^N) - exponential  
**Use Case:** Q5, subset/combination problems

---

### Template 8: Two Pointers Pattern

```java
int left = 0;
int right = n - 1;

while (left < right) {
    if (condition) {
        // Process arr[left] and arr[right]
        left++;
        right--;
    } else if (needMoveLeft) {
        left++;
    } else {
        right--;
    }
}
```

**Time Complexity:** O(N)  
**Use Case:** Pair sum, palindrome check, sorted array problems

---

### Template 9: Frequency Counting with HashMap

```java
HashMap<Integer, Integer> freq = new HashMap<>();

// Count frequencies
for (int num : arr) {
    freq.put(num, freq.getOrDefault(num, 0) + 1);
}

// Check frequency
if (freq.containsKey(target)) {
    int count = freq.get(target);
}

// Iterate through frequencies
for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
    int element = entry.getKey();
    int count = entry.getValue();
}
```

**Time Complexity:** O(N) for building, O(1) for lookup  
**Use Case:** Duplicate detection, counting problems

---

### Template 10: ArrayList Standard Operations

```java
ArrayList<Integer> list = new ArrayList<>();

// Add
list.add(10);                    // O(1) amortized
list.add(0, 5);                  // O(N) - insert at index

// Remove
list.remove(list.size() - 1);    // O(1) - remove last
list.remove(0);                  // O(N) - remove first
list.remove(Integer.valueOf(10)); // O(N) - remove by value

// Access
int val = list.get(0);           // O(1)
list.set(0, 20);                 // O(1)

// Search
boolean exists = list.contains(10);  // O(N)
int index = list.indexOf(10);        // O(N)

// Utility
list.isEmpty();
list.size();
Collections.sort(list);          // O(N log N)
```

---

### Template 11: Two Pointers - Pair Sum

```java
// For SORTED array, find pair with given sum
public static void findPairSum(int[] arr, int target) {
    Arrays.sort(arr);  // Sort if not already sorted

    int left = 0;
    int right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            System.out.println(arr[left] + " " + arr[right]);
            return;  // Found
        } else if (sum < target) {
            left++;   // Need larger sum
        } else {
            right--;  // Need smaller sum
        }
    }

    System.out.println("No Pair Found");
}
```

**Time Complexity:** O(N log N) for sort + O(N) for search  
**Use Case:** Pair sum, two elements problems

---

### Template 12: Array Rotation (Reversal Method)

```java
// Rotate RIGHT by K positions
public static void rotateRight(int[] arr, int k) {
    int n = arr.length;
    k = k % n;  // Handle k > n

    reverse(arr, 0, n - 1);      // Reverse entire
    reverse(arr, 0, k - 1);      // Reverse first k
    reverse(arr, k, n - 1);      // Reverse remaining
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

**Time Complexity:** O(N)  
**Space Complexity:** O(1) - in-place  
**Use Case:** Rotation, reversal problems

---

### Template 13: Prefix Sum Array

```java
// Build prefix sum for range queries
public static int[] buildPrefixSum(int[] arr) {
    int n = arr.length;
    int[] prefix = new int[n];

    prefix[0] = arr[0];
    for (int i = 1; i < n; i++) {
        prefix[i] = prefix[i - 1] + arr[i];
    }

    return prefix;
}

// Query sum from index L to R
public static int rangeSum(int[] prefix, int L, int R) {
    if (L == 0) {
        return prefix[R];
    }
    return prefix[R] - prefix[L - 1];
}
```

**Time Complexity:** O(N) build, O(1) per query  
**Use Case:** Multiple range sum queries

---

### Template 14: Frequency Counter with Array (Limited Range)

```java
// When values are in range [0, MAX]
public static void countFrequency(int[] arr, int MAX) {
    int[] freq = new int[MAX + 1];  // Index = value

    // Count frequencies
    for (int num : arr) {
        freq[num]++;
    }

    // Find most frequent
    int maxFreq = 0;
    int mostFrequent = -1;
    for (int i = 0; i <= MAX; i++) {
        if (freq[i] > maxFreq) {
            maxFreq = freq[i];
            mostFrequent = i;
        }
    }
}
```

**Time Complexity:** O(N + MAX)  
**Space Complexity:** O(MAX)  
**Use Case:** When value range is limited and known

---

### Template 15: Kadane's Algorithm (Max Subarray Sum)

```java
// Find maximum sum of any contiguous subarray
public static int maxSubarraySum(int[] arr) {
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
```

**Time Complexity:** O(N)  
**Use Case:** Maximum/minimum subarray problems

---

### Template 16: Dutch National Flag (Sort 0s, 1s, 2s)

```java
// Sort array with only 3 values (0, 1, 2)
public static void dutchFlagSort(int[] arr) {
    int low = 0;      // Boundary for 0s
    int mid = 0;      // Current element
    int high = arr.length - 1;  // Boundary for 2s

    while (mid <= high) {
        if (arr[mid] == 0) {
            swap(arr, low, mid);
            low++;
            mid++;
        } else if (arr[mid] == 1) {
            mid++;
        } else {  // arr[mid] == 2
            swap(arr, mid, high);
            high--;
            // Don't move mid (need to check swapped element)
        }
    }
}

public static void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

**Time Complexity:** O(N)  
**Space Complexity:** O(1)  
**Use Case:** 3-way partitioning, sorting with limited values

---

### Template 17: Sliding Window Optimization

```java
// Find maximum sum of K consecutive elements (OPTIMIZED)
public static int maxSumWindowOptimized(int[] arr, int k) {
    int n = arr.length;

    // Calculate first window
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;

    // Slide window: remove left, add right
    for (int i = k; i < n; i++) {
        windowSum = windowSum - arr[i - k] + arr[i];
        maxSum = Math.max(maxSum, windowSum);
    }

    return maxSum;
}
```

**Time Complexity:** O(N) instead of O(N×K)  
**Use Case:** When window operations are aggregate (sum, avg, etc.)

---

### Template 18: String to Character Array Processing

```java
// Process string character by character
public static void processString(String str) {
    char[] chars = str.toCharArray();

    for (int i = 0; i < chars.length; i++) {
        char c = chars[i];

        // Check type
        if (Character.isDigit(c)) {
            int digit = c - '0';  // Convert to number
        } else if (Character.isLowerCase(c)) {
            int position = c - 'a';  // 0-25
        } else if (Character.isUpperCase(c)) {
            int position = c - 'A';  // 0-25
        }
    }
}
```

**Common Operations:**

- `'5' - '0' = 5` (char to digit)
- `'a' - 'a' = 0, 'z' - 'a' = 25` (position)
- `Character.toLowerCase(c)` / `toUpperCase(c)`
- `Character.isLetterOrDigit(c)`

---

### Template 19: Matrix Traversal Patterns

```java
// Pattern 1: Row by row
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        // Process matrix[i][j]
    }
}

// Pattern 2: Column by column
for (int j = 0; j < cols; j++) {
    for (int i = 0; i < rows; i++) {
        // Process matrix[i][j]
    }
}

// Pattern 3: Diagonal (top-left to bottom-right)
for (int i = 0; i < Math.min(rows, cols); i++) {
    // Process matrix[i][i]
}

// Pattern 4: Anti-diagonal (top-right to bottom-left)
for (int i = 0; i < Math.min(rows, cols); i++) {
    // Process matrix[i][cols - 1 - i]
}

// Pattern 5: Spiral order
// (More complex - requires boundary tracking)
```

---

### Template 20: Binary Search on Answer Space

```java
// When answer lies in range and can be verified
public static int binarySearchAnswer(int[] arr, int target) {
    int low = /* min possible answer */;
    int high = /* max possible answer */;
    int result = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;  // Avoid overflow

        if (isPossible(arr, mid, target)) {
            result = mid;           // Found candidate
            high = mid - 1;         // Try to minimize (for minimum problems)
            // OR: low = mid + 1    // Try to maximize (for maximum problems)
        } else {
            low = mid + 1;          // Need larger value
        }
    }

    return result;
}

// Check if 'candidate' is valid answer
public static boolean isPossible(int[] arr, int candidate, int target) {
    // Verification logic (problem-specific)
    // Return true if candidate works
    return true;
}
```

**Use Case:** "Find minimum/maximum value such that..."

---

## 🎯 COMMON LOGIC BLOCKS BY PROBLEM TYPE

### Block Set 1: Array Searching

```java
// Linear search
public static int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// Binary search (sorted array)
public static int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// Find first occurrence
public static int firstOccurrence(int[] arr, int target) {
    int result = -1;
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;
            right = mid - 1;  // Continue searching left
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}
```

---

### Block Set 2: Array Min/Max Operations

```java
// Find maximum
public static int findMax(int[] arr) {
    int max = arr[0];  // Or Integer.MIN_VALUE for empty check
    for (int num : arr) {
        max = Math.max(max, num);
    }
    return max;
}

// Find second maximum
public static int findSecondMax(int[] arr) {
    int max = Integer.MIN_VALUE;
    int secondMax = Integer.MIN_VALUE;

    for (int num : arr) {
        if (num > max) {
            secondMax = max;
            max = num;
        } else if (num > secondMax && num != max) {
            secondMax = num;
        }
    }
    return secondMax;
}

// Find min and max together
public static int[] findMinMax(int[] arr) {
    int min = arr[0];
    int max = arr[0];

    for (int num : arr) {
        min = Math.min(min, num);
        max = Math.max(max, num);
    }

    return new int[]{min, max};
}
```

---

### Block Set 3: Subarray Operations

```java
// Print all subarrays
public static void printAllSubarrays(int[] arr) {
    int n = arr.length;

    for (int start = 0; start < n; start++) {
        for (int end = start; end < n; end++) {
            // Subarray from start to end
            for (int k = start; k <= end; k++) {
                System.out.print(arr[k] + " ");
            }
            System.out.println();
        }
    }
}

// Find subarray with given sum
public static void findSubarrayWithSum(int[] arr, int target) {
    int n = arr.length;

    for (int start = 0; start < n; start++) {
        int sum = 0;
        for (int end = start; end < n; end++) {
            sum += arr[end];

            if (sum == target) {
                System.out.println("Subarray: " + start + " to " + end);
                return;
            }
        }
    }
    System.out.println("Not found");
}

// Count subarrays with sum K (using HashMap)
public static int countSubarraysWithSum(int[] arr, int k) {
    HashMap<Integer, Integer> map = new HashMap<>();
    map.put(0, 1);  // Empty subarray

    int sum = 0;
    int count = 0;

    for (int num : arr) {
        sum += num;
        count += map.getOrDefault(sum - k, 0);
        map.put(sum, map.getOrDefault(sum, 0) + 1);
    }

    return count;
}
```

---

### Block Set 4: String Pattern Matching

```java
// Check if string contains substring
public static boolean containsPattern(String str, String pattern) {
    return str.contains(pattern);  // Built-in

    // Manual implementation
    for (int i = 0; i <= str.length() - pattern.length(); i++) {
        if (str.substring(i, i + pattern.length()).equals(pattern)) {
            return true;
        }
    }
    return false;
}

// Count occurrences of character
public static int countChar(String str, char ch) {
    int count = 0;
    for (char c : str.toCharArray()) {
        if (c == ch) count++;
    }
    return count;
}

// Check if palindrome
public static boolean isPalindrome(String str) {
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
```

---

// Utility
list.isEmpty();
list.size();
Collections.sort(list); // O(N log N)
Collections.reverse(list); // O(N)

````

---

## 🚨 COMMON BOUNDARY TRAPS (Your Weak Point)

### Trap 1: Inclusive vs Exclusive Ranges

```java
// PROBLEM: "Range [start, end]"
// WRONG:
for (int i = start + 1; i < end; i++)  // Excludes BOTH boundaries

// CORRECT:
for (int i = start; i <= end; i++)     // Includes BOTH boundaries
````

**Memory Aid:** Square brackets [a, b] → INCLUSIVE

---

### Trap 2: Loop Termination in Sliding Window

```java
// PROBLEM: "Windows of size K in array of size N"
// WRONG:
for (int i = 0; i < n - k; i++)  // Misses last window

// CORRECT:
for (int i = 0; i <= n - k; i++)  // Includes all windows
```

**Example:** N=5, K=2

- Windows: [0-1], [1-2], [2-3], [3-4]
- Last window starts at i=3 = 5-2
- Need `i <= 3`

---

### Trap 3: Prime Check Loop Boundary

```java
// WRONG:
for (int i = 2; i < num/2; i++)  // Misses exact divisor at num/2

// CORRECT:
for (int i = 2; i * i <= num; i++)  // Optimal and correct
// OR
for (int i = 2; i <= num/2; i++)  // Correct but slower
```

---

### Trap 4: Counter Increment Timing

```java
// WRONG:
if (isPrime(num)) {
    if (num == target) {
        print(count);  // Uses OLD count
    }
    count++;  // Increments AFTER
}

// CORRECT:
if (isPrime(num)) {
    count++;  // Increment FIRST
    if (num == target) {
        print(count);  // Uses UPDATED count
    }
}
```

---

### Trap 5: Digit Extraction Edge Cases

```java
// PROBLEM: Negative numbers
// INCOMPLETE:
while (num > 0) {
    sum += num % 10;
    num /= 10;
}

// COMPLETE:
num = Math.abs(num);  // Convert to positive first
while (num > 0) {
    sum += num % 10;
    num /= 10;
}
```

---

### Trap 6: Empty Result Handling

```java
// WRONG:
for (...) {
    if (condition) {
        System.out.print(value + " ");
    }
}
// No output if no matches found

// CORRECT:
boolean found = false;
for (...) {
    if (condition) {
        System.out.print(value + " ");
        found = true;
    }
}
if (!found) {
    System.out.println("No Numbers");
}
```

---

# 2-DAY LEARNING ROADMAP

## 🎯 Day 1: Fix Existing + Core Patterns (8 hours)

### Morning Session (4 hours) - Fix Your Failed Questions

#### Hour 1: Q1 Prime Position - Deep Dive

- [ ] Read corrected solution line by line
- [ ] Understand isPrime fix: `i * i <= num`
- [ ] Understand counter timing: increment FIRST
- [ ] Rewrite from scratch WITHOUT looking at solution
- [ ] Test with: 7, 19, 10, 4, 0, -5
- [ ] Verify ALL test cases pass

**Practice:** Solve these variations without help:

1. Print all primes from 1 to N
2. Find the Nth prime number
3. Count primes in range [L, R]

---

#### Hour 2: Q3 Digit Sum - Boundary Mastery

- [ ] Identify the exact bug: `start+1` and `i<end`
- [ ] Understand inclusive range: `[a, b]` means both included
- [ ] Rewrite from scratch
- [ ] Test with examples + edge cases: [4,4,5], [1,100,7]
- [ ] Practice boundary conditions:
    - When to use `<=` vs `<`
    - When to start at `start` vs `start+1`

**Practice:**

1. Find numbers in range where digit product divisible by K
2. Find sum of all digits in range [L, R]
3. Count Armstrong numbers in range

---

#### Hour 3: Q4 Pattern - Validation Discipline

- [ ] Add ZERO check first
- [ ] Add negative check second
- [ ] Understand pattern: spaces vs characters
- [ ] Rewrite with proper validation
- [ ] Test: 0, -1, 5, 8, 26

**Practice:**

1. Number triangle (incrementing numbers)
2. Reverse alphabet triangle
3. Diamond pattern

---

#### Hour 4: Review + Consolidate

- [ ] List all YOUR mistakes from Q1, Q3, Q4
- [ ] Create personal "Never Again" checklist
- [ ] Memorize validation template
- [ ] Time yourself: Solve all 3 in 60 minutes

---

### Afternoon Session (4 hours) - Learn Missing Patterns

#### Hour 5: Sliding Window - Q2 Pattern

- [ ] Read Q2 solution (brute force version)
- [ ] Understand window concept: fixed-size subarray
- [ ] Learn formula: `N - K + 1` windows
- [ ] Understand loop: `i <= n - k`
- [ ] Code from scratch
- [ ] Test with examples

**Practice:**

1. Maximum in every window
2. Sum of every window
3. Count elements > X in every window

---

#### Hour 6: Backtracking Basics - Q5 Introduction

- [ ] Understand recursion: function calling itself
- [ ] Learn the pattern: Make Choice → Recurse → Undo
- [ ] Study Q5 solution step by step
- [ ] Trace execution for [4,5,8], key=8
- [ ] Try coding with heavy commenting

**Don't expect mastery today - this is HARD**
Goal: Understand the structure, not perfect implementation

**Practice:**

1. Print all subsets (no sum condition)
2. Count subsets with sum = K

---

#### Hour 7: Templates & Collections

- [ ] Copy all 10 templates to separate file
- [ ] Memorize validation template (30 min)
- [ ] Practice ArrayList methods (add, remove, get)
- [ ] Practice HashMap (put, get, containsKey)
- [ ] Do 10 quick drills:
    - Create ArrayList, add 5 elements, remove middle
    - Create HashMap, count frequency of array
    - StringBuilder: build string from array

---

#### Hour 8: MCQs + Rapid Testing

- [ ] Answer all MCQs in main document
- [ ] Review wrong answers
- [ ] Understand WHY each wrong answer fails
- [ ] Create flashcards for tricky concepts

---

## 🚀 Day 2: Speed + New Problems (8 hours)

### Morning Session (4 hours) - Timed Practice

#### Hour 1: Speed Drills (15 min each)

1. **Q1 variant:** Check if N is prime, print position (15 min)
2. **Q3 variant:** Numbers in [50, 100] with digit sum divisible by 3 (15 min)
3. **Q4 variant:** Number triangle (15 min)
4. **Q2 variant:** First positive in every window (15 min)

**Goal:** Solve each under time pressure, 100% correct

---

#### Hour 2: Combination Problems

Solve problems that mix patterns:

1. **Pattern + Validation:** Print prime triangle (combine Q1 + Q4)
2. **Window + Condition:** Windows where sum is prime
3. **Range + Digit:** Count primes with even digit sum in range

---

#### Hour 3: Common Netcracker Questions

**Array Problems:**

1. Find second largest in array
2. Rotate array by K positions
3. Remove duplicates from sorted array
4. Find missing number in 1 to N

**String Problems:**

1. Check palindrome
2. Reverse words in string
3. Count vowels and consonants
4. Check anagram

---

#### Hour 4: Debug Practice

Given buggy code (similar to YOUR original code), find and fix bugs:

1. Prime check with wrong loop boundary
2. Range iteration missing boundaries
3. Pattern without validation
4. Window with wrong loop condition

---

### Afternoon Session (4 hours) - Mock Exam + Review

#### Hour 5: Mock Exam (90 minutes)

**Simulate real exam conditions:**

- 2 coding questions (45 min each)
- No help, no looking at solutions
- Must handle all constraints
- Must pass 80%+ test cases

**Sample Problems:**

1. **Problem A:** Find all pairs in array that sum to K
2. **Problem B:** Print diagonal pattern with numbers

---

#### Hour 6: Review Mock Exam

- [ ] Check solutions against expected output
- [ ] Identify every mistake
- [ ] Categorize: boundary? validation? logic?
- [ ] Redo wrong parts from scratch

---

#### Hour 7: Advanced Patterns (Optional)

If feeling confident, learn these:

**Two Pointers:**

```java
int left = 0, right = n - 1;
while (left < right) {
    if (arr[left] + arr[right] == target) {
        // Found pair
        left++; right--;
    } else if (arr[left] + arr[right] < target) {
        left++;
    } else {
        right--;
    }
}
```

**Prefix Sum:**

```java
int[] prefix = new int[n];
prefix[0] = arr[0];
for (int i = 1; i < n; i++) {
    prefix[i] = prefix[i-1] + arr[i];
}
// Sum of range [L, R] = prefix[R] - prefix[L-1]
```

---

#### Hour 8: Final Prep + Confidence Building

- [ ] Review all templates one final time
- [ ] Do 20 rapid MCQs (test knowledge retention)
- [ ] List your top 5 weaknesses → strategies to avoid
- [ ] Practice validation template 5 times from memory
- [ ] Sleep well - REST IS CRITICAL

---

## 📝 Pre-Exam Checklist (30 minutes before)

### Must Review (10 minutes)

- [ ] Input validation template
- [ ] Inclusive range: `for (int i = start; i <= end; i++)`
- [ ] Sliding window: `for (int i = 0; i <= n - k; i++)`
- [ ] isPrime: `for (int i = 3; i * i <= num; i += 2)`
- [ ] Counter timing: increment FIRST, then check

### Must Remember (Mindset)

- [ ] Read constraints TWICE before coding
- [ ] Write validation FIRST (5 lines max)
- [ ] Draw boundaries: first/last iteration
- [ ] Test with: 0, 1, N, -1 mentally
- [ ] If stuck, solve brute force first

### Red Flags to Avoid

- [ ] Don't use `start+1` or `i<end` for inclusive ranges
- [ ] Don't increment counter AFTER using it
- [ ] Don't skip ZERO / negative validation
- [ ] Don't use `i < num/2` for prime check

---

## 🎯 Success Metrics

### Day 1 End Goals

- [ ] Can solve Q1, Q3, Q4 in < 15 min each, 100% accuracy
- [ ] Can solve Q2 brute force version correctly
- [ ] Understand Q5 structure (even if can't code perfectly)
- [ ] 90%+ on MCQs
- [ ] Templates memorized

### Day 2 End Goals

- [ ] Can solve 2 medium problems in 90 min
- [ ] Pass 80%+ test cases on first submission
- [ ] Zero validation mistakes
- [ ] Zero boundary condition mistakes
- [ ] Confident with ArrayList, HashMap basics

### Exam Day Goals

- [ ] Score 60%+ overall (PASS threshold)
- [ ] Score 80%+ on one coding question
- [ ] Complete all MCQs with 70%+ accuracy
- [ ] No time wasted on validation (muscle memory)
- [ ] Clean, readable code

---

## 📚 Long-Term Improvement (Post-Exam)

### Week 1-2: Strengthen Foundations

- Practice 5 problems daily (mix of patterns)
- Focus on: Two Pointers, Prefix Sum, Kadane's
- Leetcode Easy: 20 problems

### Month 1: Build Confidence

- Solve 100 array + string problems
- Learn: Binary Search, Stack, Queue
- Participate in 4 online contests

### Month 3: Interview Ready

- Solve medium problems (60% success rate)
- Mock interviews with peers
- System design basics
- Leetcode Medium: 50 problems

---

# FINAL WORDS OF ADVICE

## From a Senior Engineer to You

### What Went Wrong in Your Last Exam

1. **Boundary conditions** - You're not alone, 70% of juniors fail this
2. **Constraint validation** - Rushing to logic, ignoring requirements
3. **Pattern recognition** - Never learned sliding window, backtracking

### What Will Make You Pass Next Time

1. **SLOW DOWN** - Read constraints twice, validate first
2. **DRAW IT OUT** - Sketch first/last iteration for loops
3. **TEST MENTALLY** - Before submitting, test with 0, 1, N
4. **PATTERN AWARENESS** - "window" → sliding, "all possibilities" → backtracking

### The Truth About Netcracker Exams

- They don't test genius-level algorithms
- They test **precision and attention to detail**
- Passing = avoiding careless mistakes, not brilliance
- 60% is achievable with **discipline**, not talent

### Your Competitive Advantage

- You already attempted 3/5 questions (many attempt 0)
- Your logic IS correct (just boundary bugs)
- You learn from mistakes (reading this proves it)
- 2 days is ENOUGH time to fix your weak points

### Believe in the Process

- Follow this roadmap strictly
- Don't skip the boring parts (templates, MCQs)
- Practice under time pressure
- Sleep 8 hours before exam

**You don't need to be perfect. You need to be 60% correct and 100% careful.**

---

## � PROGRESS TRACKER

### Question Mastery Checklist

#### Q1: Prime Position

- [ ] Understood isPrime bug (`i*i <= num` vs `i < num/2`)
- [ ] Understood counter timing bug (increment FIRST)
- [ ] Added input validation (`n <= 0`)
- [ ] Coded from scratch without help
- [ ] Passed all test cases (0, -5, 4, 7, 19)
- [ ] Solved in < 15 minutes
- [ ] **Mastery Level:** ⬜ Beginner | ⬜ Intermediate | ⬜ Expert

#### Q2: Sliding Window

- [ ] Understood window concept (fixed-size subarray)
- [ ] Memorized loop boundary (`i <= n-k`)
- [ ] Can calculate window count (N-K+1)
- [ ] Coded brute force solution
- [ ] Handled "No Numbers" case
- [ ] Solved in < 20 minutes
- [ ] **Mastery Level:** ⬜ Beginner | ⬜ Intermediate | ⬜ Expert

#### Q3: Digit Sum

- [ ] Identified boundary bug (`start+1, i<end`)
- [ ] Fixed to inclusive range (`start, i<=end`)
- [ ] Digit extraction works for negatives
- [ ] Coded from scratch
- [ ] Passed edge cases ([4,4,5], [1,100,7])
- [ ] Solved in < 15 minutes
- [ ] **Mastery Level:** ⬜ Beginner | ⬜ Intermediate | ⬜ Expert

#### Q4: Pattern

- [ ] Added ZERO validation
- [ ] Added negative validation
- [ ] Understood space formula (n - row)
- [ ] ASCII exhaustion logic clear
- [ ] Coded from scratch
- [ ] Solved in < 10 minutes
- [ ] **Mastery Level:** ⬜ Beginner | ⬜ Intermediate | ⬜ Expert

#### Q5: Subset Sum

- [ ] Understood recursion basics
- [ ] Understood backtracking (add → recurse → remove)
- [ ] Can trace execution manually
- [ ] Coded with heavy comments
- [ ] Handled empty subset case
- [ ] Solved in < 30 minutes
- [ ] **Mastery Level:** ⬜ Beginner | ⬜ Intermediate | ⬜ Expert

### Daily Practice Log

| Date     | Questions Solved | Time Taken | Test Cases Passed | Mistakes Made |
| -------- | ---------------- | ---------- | ----------------- | ------------- |
| Day 1 AM |                  |            |                   |               |
| Day 1 PM |                  |            |                   |               |
| Day 2 AM |                  |            |                   |               |
| Day 2 PM |                  |            |                   |               |

### Mistake Pattern Analysis

| Mistake Type                     | Tally | Last Occurrence | Fixed? |
| -------------------------------- | ----- | --------------- | ------ |
| Boundary condition (loop)        |       |                 | ⬜     |
| Missing validation               |       |                 | ⬜     |
| Counter timing                   |       |                 | ⬜     |
| Pattern not recognized           |       |                 | ⬜     |
| Array index out of bounds        |       |                 | ⬜     |
| String comparison (== vs equals) |       |                 | ⬜     |

---

## 🎯 MOCK EXAM SIMULATION (Day 2, Hour 5)

### Setup Instructions

1. ⏰ Set timer for **90 minutes** (strict)
2. 🚫 Close all reference materials (including these documents)
3. 📝 Use only blank text editor or IDE
4. 🌐 No internet searches allowed
5. ✅ Compile and test locally before submission

### Problem Set 1 (Standard Difficulty)

#### **Problem 1A: Pair Sum (45 minutes)**

```
Description:
Find all unique pairs in array that sum to given target.

Input:
First line: Array size N
Second line: N space-separated integers
Third line: Target sum K

Output:
Print all unique pairs (a, b) where a+b=K, one pair per line
Pairs should be in ascending order: smaller element first
If no pairs exist, print "No Pairs"

Constraints:
- N > 0, else "Invalid Input"
- Array can have duplicates
- Each unique pair printed only once
- Pairs sorted by first element, then second element

Example 1:
Input:      6
            1 2 3 4 5 6
            7

Output:     1 6
            2 5
            3 4

Example 2:
Input:      4
            1 1 2 2
            3

Output:     1 2

Explanation 2: Even though there are multiple 1s and 2s,
               we print the pair (1,2) only once.
```

**Your Solution Strategy:**

- Use two pointers (if sorted)
- OR use HashMap for O(N) solution
- Remember to handle duplicates
- Validate N > 0

---

#### **Problem 1B: Rotate Array Right (45 minutes)**

```
Description:
Rotate array to right by K positions.

Input:
First line: Array size N
Second line: N space-separated integers
Third line: K (number of rotations)

Output:
Print rotated array elements separated by space

Constraints:
- N > 0, else "Invalid Input"
- K >= 0, else "Invalid Input"
- K can be > N (use K % N)
- Handle K = 0 (no rotation)

Example 1:
Input:      5
            1 2 3 4 5
            2

Output:     4 5 1 2 3

Explanation: Right rotation by 2
             Step 1: 5 1 2 3 4
             Step 2: 4 5 1 2 3

Example 2:
Input:      3
            10 20 30
            5

Output:     20 30 10

Explanation: K=5, N=3, effective rotation = 5%3 = 2
```

**Your Solution Strategy:**

- Effective rotation: `k = k % n`
- Use reversal algorithm: reverse(0,n-1), reverse(0,k-1), reverse(k,n-1)
- OR create new array and place elements at `(i+k)%n`

---

### Problem Set 2 (Advanced - If Time Permits)

#### **Problem 2A: Longest Subarray with Sum K**

```
Find length of longest contiguous subarray with sum exactly = K
Handle negative numbers
Use prefix sum approach
```

#### **Problem 2B: Second Largest Element**

```
Find second largest unique element in array
Edge cases: all same elements, only one unique element
Output: "No Second Largest" if not possible
```

---

### Scoring Rubric (Grade Yourself)

| Criteria                            | Points  | Your Score |
| ----------------------------------- | ------- | ---------- |
| **Problem 1A**                      |         |            |
| - Correct output for all test cases | 15      |            |
| - Handles duplicates correctly      | 5       |            |
| - Input validation complete         | 5       |            |
| - Time: < 45 min                    | 5       |            |
| **Problem 1B**                      |         |            |
| - Correct output for K <= N         | 10      |            |
| - Handles K > N correctly (K%N)     | 5       |            |
| - Handles K = 0                     | 3       |            |
| - Input validation complete         | 5       |            |
| - Time: < 45 min                    | 2       |            |
| **Code Quality**                    |         |            |
| - Clean, readable code              | 5       |            |
| - Proper variable names             | 5       |            |
| - Comments where needed             | 5       |            |
| **Overall**                         |         |            |
| - Both problems attempted           | 10      |            |
| - Time management (90 min total)    | 10      |            |
| - No reference materials used       | 10      |            |
| **TOTAL**                           | **100** | **\_\_\_** |

**Pass Threshold:** 60/100  
**Target Score:** 75/100  
**Excellent Score:** 85+/100

---

### Post-Mock Review Checklist

After completing mock exam:

1. **Immediate Review (30 min)**
    - [ ] Compile both solutions
    - [ ] Test with provided examples
    - [ ] Test with edge cases: 0, 1, N, negative
    - [ ] Check validation code
2. **Mistake Analysis (20 min)**
    - [ ] List every bug found
    - [ ] Categorize: boundary, validation, logic, syntax
    - [ ] Mark in Mistake Pattern Analysis table above
3. **Redo Wrong Parts (30 min)**
    - [ ] Fix bugs one by one
    - [ ] Retest after each fix
    - [ ] Compare with optimal solution
4. **Pattern Recognition (10 min)**
    - [ ] What pattern did 1A use? (Two pointers / HashMap)
    - [ ] What pattern did 1B use? (Array rotation / Reversal)
    - [ ] Could you recognize them faster next time?

5. **Time Reflection (10 min)**
    - [ ] Did you spend too long on one problem?
    - [ ] Did you read constraints carefully?
    - [ ] Did you test before submitting?

---

## 🎯 ADDITIONAL PRACTICE PROBLEMS

### Level 4: Sliding Window Practice

#### **Problem 4.1: Maximum Sum Window**

```java
// Given: array, window size K
// Find: maximum sum of any subarray of size K
// Your code here:
```

**Test Cases:**

```
Input: [1, 4, 2, 10, 23, 3, 1, 0, 20], K=4
Output: 39
Explanation: [10, 23, 3, 1] has sum 39

Input: [-1, -2, -3, -4], K=2
Output: -3
Explanation: [-1, -2] has sum -3 (least negative)
```

---

#### **Problem 4.2: Count Negatives in Each Window**

```java
// Given: array, window size K
// Output: count of negative numbers in each window
// Example: [-1, 2, -3, 4, 5], K=2
// Output: 1 1 1 0
```

---

#### **Problem 4.3: First Positive in Each Window**

```java
// Similar to Q2 but for positive numbers
// If no positive exists, print 0
```

---

### Level 6: Subarray Sum Practice

#### **Problem 6.1: All Subarrays with Sum K (Your ChatGPT Question)**

```java
// WITHOUT Collections
public class AllSubarraySum {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int key = sc.nextInt();

        boolean found = false;

        // YOUR CODE: nested loops to check all subarrays
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

**Test This With:**

```
Input: 5
       4 5 8 2 6
       8
Output: 8
        2 6
```

---

#### **Problem 6.2: Count Subarrays with Sum K**

```java
// Instead of printing, just count how many subarrays
// Output: single integer
```

---

#### **Problem 6.3: Maximum Length Subarray with Sum K**

```java
// Find the longest subarray (continuous) with sum = K
// Output: length of that subarray
// Use prefix sum + HashMap for O(N) solution
```

---

## 🔧 DEBUGGING PRACTICE

### Debug Exercise 1: Find the Bugs

```java
// This code has 5 bugs. Find and fix them.
public class BuggyCode {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[] arr = new int[n];
        for (int i = 0; i <= n; i++) {  // BUG 1
            arr[i] = sc.nextInt();
        }

        int k = sc.nextInt();

        int maxSum = 0;  // BUG 2
        for (int i = 0; i < n - k; i++) {  // BUG 3
            int sum = 0;
            for (int j = i; j < i + k; j++) {
                sum += arr[j];
            }
            if (sum > maxSum) {
                maxSum = sum;
            }
        }

        System.out.println(maxSum);
    }
}
```

**Bugs:**

1. Loop boundary: `i <= n` should be `i < n`
2. maxSum init: Should be `Integer.MIN_VALUE` for negative arrays
3. Outer loop: `i < n-k` should be `i <= n-k`
4. (Hidden) No input validation for n <= 0
5. (Hidden) No validation for k <= 0 or k > n

---

## �🚀 GO CRUSH THAT EXAM! 🚀

**Remember:** Every Netcracker engineer started where you are. The difference is they fixed their boundaries, learned their patterns, and validated their inputs. You're doing the same. You're ready.
