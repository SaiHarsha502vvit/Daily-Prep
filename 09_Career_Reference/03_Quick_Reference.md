# 🚀 NETCRACKER EXAM - QUICK REFERENCE CHEAT SHEET

## 🧠 IF YOU FREEZE WHEN CODING - USE THIS!

### The 5-Step Translation Method (Paper → Code)

**When you understand on paper but freeze in editor:**

```
            5-STEP PAPER TO CODE METHOD
──────────────────────────────────────────────────

STEP 1: NAME THE PATTERN
┌───────────────────────────────────────────────────────────┐
│  "This is _______ pattern"                                │
│  (Sliding Window / Two Pointers / Frequency Count...)     │
└───────────────────────────────────────────────────────────┘
                         ↓
STEP 2: WRITE SKELETON
┌───────────────────────────────────────────────────────────┐
│  public static void solve(int[] arr) {                    │
│      for (int j = 0; j < arr.length; j++) {               │
│          // LOGIC GOES HERE                               │
│      }                                                    │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
                         ↓
STEP 3: ADD INVARIANT (The rule that's always true)
┌───────────────────────────────────────────────────────────┐
│  // window size = j - i + 1                               │
│  // OR: sum of window = current_sum                       │
│  // OR: left pointer < right pointer                      │
└───────────────────────────────────────────────────────────┘
                         ↓
STEP 4: LAYER LOGIC (One line at a time)
┌───────────────────────────────────────────────────────────┐
│  First: Add the core operation                            │
│  Then: Add the condition check                            │
│  Then: Add the result update                              │
└───────────────────────────────────────────────────────────┘
                         ↓
STEP 5: EDGE CASES (At the very end)
┌───────────────────────────────────────────────────────────┐
│  if (arr == null || arr.length == 0) return;              │
│  if (n < 0) System.out.println("Invalid Input");          │
└───────────────────────────────────────────────────────────┘
```

**See:** [PaperToCode_TranslationGuide.md](PaperToCode_TranslationGuide.md) for details

---

## 🎨 VISUAL PATTERN RECOGNITION GUIDE

```
           WHICH PATTERN DO I USE? (Decision Tree)
──────────────────────────────────────────────────

┌─── Does problem involve ARRAY/STRING? ───┐
│                                          │
▼ YES                                      ▼ NO
│                                          │
├─ "window of size K"? ───→ SLIDING WINDOW │
│                                          ├─ "tree structure"?
├─ "two elements sum"? ───→ TWO POINTERS   │        → BFS/DFS
│                                          │
├─ "count frequency"? ────→ HASHMAP        ├─ "graph/nodes"?
│                                          │        → BFS/DFS
├─ "sorted array"? ───────→ BINARY SEARCH  │
│                                          ├─ "generate all"?
├─ "maximum subarray"? ───→ KADANE'S       │        → BACKTRACKING
│                                          │
├─ "palindrome"? ─────────→ TWO POINTERS   └─ "optimize/minimize"?
│                                                   → DP / GREEDY
├─ "range sum"? ──────────→ PREFIX SUM
│
├─ "balanced brackets"? ──→ STACK
│
├─ "rotate/spiral"? ──────→ MATRIX PATTERN
│
└─ "GCD/prime/bits"? ─────→ MATH / BIT MANIPULATION
```

---

## ⚡ COPY-PASTE TEMPLATES (Memorize These!)

### 🎨 Template 1: Input Validation

```
                INPUT VALIDATION VISUAL
──────────────────────────────────────────────────

User Input: n = ?
            │
            ▼
       ┌────────────┐
       │  n == 0 ?  │──YES──→ print("ZERO") and return
       └────────────┘
            │ NO
            ▼
       ┌────────────┐
       │  n < 0 ?   │──YES──→ print("Invalid Input") and return
       └────────────┘
            │ NO
            ▼
       Continue with main logic...

```

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
```

### 🎨 Template 2: Sliding Window (Fixed Size K)

```
            SLIDING WINDOW (SIZE K) VISUALIZATION
──────────────────────────────────────────────────

Array: [1, 3, 5, 2, 8, 1, 9]    k = 3

Step 1: j=0                     Step 2: j=1
┌───┬───┬───┬───┬───┬───┬───┐   ┌───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 5 │ 2 │ 8 │ 1 │ 9 │   │ 1 │ 3 │ 5 │ 2 │ 8 │ 1 │ 9 │
└───┴───┴───┴───┴───┴───┴───┘   └───┴───┴───┴───┴───┴───┴───┘
  ↑                               ↑   ↑
  i,j                             i   j
count: j-i+1 = 1                count: j-i+1 = 2
(not k yet)                     (not k yet)

Step 3: j=2  ← WINDOW READY!    Step 4: j=3  ← SLIDE!
┌───┬───┬───┬───┬───┬───┬───┐   ┌───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 5 │ 2 │ 8 │ 1 │ 9 │   │ 1 │ 3 │ 5 │ 2 │ 8 │ 1 │ 9 │
└───┴───┴───┴───┴───┴───┴───┘   └───┴───┴───┴───┴───┴───┴───┘
  ↑       ↑                           ↑       ↑
  i       j                           i       j
├─────────┤                       ├─────────┤
window [1,3,5]                    window [3,5,2]
count: 2-0+1 = 3 = k ✓           After slide: i++
PROCESS NOW!

KEY INSIGHT: j - i + 1 == k means "window has k elements"
```

```java
// ✅ COUNT-BASED SLIDING WINDOW (EXAM SAFE!)
int i = 0;  // Window start
for (int j = 0; j < n; j++) {  // j expands window

    // Include arr[j] in window (add to sum, etc.)

    if (j - i + 1 == k) {  // "Does window have K elements?"
        // Process window (check max, etc.)

        // Remove arr[i] from window
        i++;  // Slide window forward
    }
}

// 🧠 REMEMBER: j - i + 1 = k  (element count = k)
```

### 🎨 Template 3: Two Pointers

```
            TWO POINTERS VISUALIZATION
──────────────────────────────────────────────────

OPPOSITE DIRECTION (Palindrome check, Two Sum in sorted):

┌───┬───┬───┬───┬───┬───┬───┐
│ r │ a │ c │ e │ c │ a │ r │
└───┴───┴───┴───┴───┴───┴───┘
  ↑                       ↑
 left                   right
  │                       │
  └───── move inward ─────┘

SAME DIRECTION (Remove duplicates, Fast-slow):

┌───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 1 │ 2 │ 2 │ 2 │ 3 │ 4 │
└───┴───┴───┴───┴───┴───┴───┘
  ↑   ↑
slow fast
  │   └───── moves every step
  └───────── moves only when condition met
```

```java
// OPPOSITE DIRECTION
int left = 0, right = arr.length - 1;
while (left < right) {
    // Process arr[left] and arr[right]
    if (condition) {
        left++;
    } else {
        right--;
    }
}

// SAME DIRECTION (Remove duplicates)
int slow = 0;
for (int fast = 1; fast < arr.length; fast++) {
    if (arr[fast] != arr[slow]) {
        slow++;
        arr[slow] = arr[fast];
    }
}
```

### 🎨 Template 4: Binary Search

```
            BINARY SEARCH VISUALIZATION
──────────────────────────────────────────────────

Array: [1, 3, 5, 7, 9, 11, 13, 15]    Target: 7

Iteration 1:
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 5 │ 7 │ 9 │ 11│ 13│ 15│
└───┴───┴───┴───┴───┴───┴───┴───┘
  ↑               ↑               ↑
 lo             mid              hi

arr[mid]=7 == target → FOUND!

If arr[mid] < target:  lo = mid + 1  (search right)
If arr[mid] > target:  hi = mid - 1  (search left)
```

```java
int lo = 0, hi = arr.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;  // Prevent overflow!
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}
return -1;  // Not found
```

### 🎨 Template 5: Stack (Balanced Brackets)

```
            STACK VISUALIZATION (Balanced Brackets)
──────────────────────────────────────────────────

Input: "([{}])"

Step 1: '(' → push       Step 2: '[' → push
┌───┐                    ┌───┐
│ ( │                    │ [ │
└───┘                    ├───┤
                         │ ( │
                         └───┘

Step 3: '{' → push       Step 4: '}' → pop, check match
┌───┐                    ┌───┐
│ { │                    │ [ │   '{' matches '}' ✓
├───┤                    ├───┤
│ [ │                    │ ( │
├───┤                    └───┘
│ ( │
└───┘

Step 5: ']' → pop        Step 6: ')' → pop
┌───┐                    Empty stack!
│ ( │   '[' matches ']' ✓         '(' matches ')' ✓
└───┘

Final: Stack empty → BALANCED ✓
```

```java
public static boolean isBalanced(String s) {
    Stack<Character> stack = new Stack<>();

    for (char ch : s.toCharArray()) {
        if (ch == '(' || ch == '{' || ch == '[') {
            stack.push(ch);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (ch == ')' && top != '(') return false;
            if (ch == '}' && top != '{') return false;
            if (ch == ']' && top != '[') return false;
        }
    }

    return stack.isEmpty();
}
```

---

## 🚨 YOUR TOP 6 MISTAKES - NEVER AGAIN!

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    COMMON MISTAKES VISUAL GUIDE                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  MISTAKE #1: Sliding Window Index Confusion                               ║
║  ─────────────────────────────────────────────                            ║
║  ❌ WRONG: for (j = i; j < i + k)   ← "Is it < or <=?"                     ║
║  ✅ RIGHT: if (j - i + 1 == k)      ← "Count = k? Easy!"                   ║
║                                                                           ║
║  MISTAKE #2: Off-by-One in Range                                          ║
║  ─────────────────────────────────                                        ║
║  Range [3, 7] means: 3, 4, 5, 6, 7 (5 numbers)                            ║
║  ❌ WRONG: for (i = 3; i < 7)       ← misses 7!                            ║
║  ✅ RIGHT: for (i = 3; i <= 7)      ← includes 7 ✓                         ║
║                                                                           ║
║  MISTAKE #3: Prime Number Check                                           ║
║  ────────────────────────────────                                         ║
║  ❌ WRONG: for (i = 2; i < num/2)   ← Too slow, O(N)                       ║
║  ✅ RIGHT: for (i = 2; i * i <= num) ← Fast, O(√N)                         ║
║                                                                           ║
║  MISTAKE #4: Counter Timing                                               ║
║  ─────────────────────────────                                            ║
║  Problem: "Count should be 1, 2, 3..."                                    ║
║  ❌ WRONG: print(count); count++;   ← prints 0, 1, 2...                    ║
║  ✅ RIGHT: count++; print(count);   ← prints 1, 2, 3... ✓                  ║
║                                                                           ║
║  MISTAKE #5: Missing Input Validation                                     ║
║  ────────────────────────────────────                                     ║
║  ❌ WRONG: Start processing immediately                                    ║
║  ✅ RIGHT: if (n <= 0) print("Invalid Input"); return;                     ║
║                                                                           ║
║  MISTAKE #6: String Comparison                                            ║
║  ───────────────────────────────                                          ║
║  ❌ WRONG: if (s1 == s2)            ← Compares references!                 ║
║  ✅ RIGHT: if (s1.equals(s2))       ← Compares content ✓                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

| Mistake                        | Wrong Code                      | Correct Code                      |
| ------------------------------ | ------------------------------- | --------------------------------- |
| **1. Sliding Window Thinking** | `for (j=i; j<i+k)` (index math) | `if (j-i+1==k)` (count elements!) |
| **2. Range Boundary**          | `for (i = start+1; i < end)`    | `for (i = start; i <= end)`       |
| **3. Prime Loop**              | `for (i = 2; i < num/2)`        | `for (i = 2; i*i <= num)`         |
| **4. Window Boundary**         | `for (i = 0; i < n-k)`          | `for (i = 0; i <= n-k)`           |
| **5. Counter Timing**          | `print(count); count++;`        | `count++; print(count);`          |
| **6. No Validation**           | `int n = sc.nextInt();`         | `if (n <= 0) print("Invalid");`   |

---

## 📋 EXAM DAY CHECKLIST (Read This First!)

### Before Writing ANY Code:

- [ ] Read constraint section TWICE
- [ ] Identify: positive only? ZERO separate? negative?
- [ ] Check range: inclusive [a,b] or exclusive (a,b)?
- [ ] Note special outputs: "Invalid Input", "ZERO", "No Numbers"

### While Coding:

- [ ] Write validation FIRST (5 lines max)
- [ ] Draw first/last iteration on paper
- [ ] Use correct loop boundaries (<= for inclusive)
- [ ] Increment counters BEFORE using them

### Before Submitting:

- [ ] Test mentally with: 0, 1, N, -1
- [ ] Check: did I validate ALL constraints?
- [ ] Check: are my loop boundaries correct?
- [ ] Check: is my output format exact?

---

## ⚡ NEW PATTERN TEMPLATES (Quick Copy-Paste)

### Template 13: GCD (Euclidean Algorithm)

```java
public static int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
```

### Template 14: Check Power of 2

```java
public static boolean isPowerOf2(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Template 15: Count Set Bits (1s in binary)

```java
public static int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        n = n & (n - 1);  // Remove rightmost set bit
        count++;
    }
    return count;
}
```

### Template 16: Rotate Matrix 90° (In-place)

```java
public static void rotate90(int[][] matrix) {
    int n = matrix.length;

    // Transpose
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }

    // Reverse each row
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
```

### Template 17: Balanced Parentheses (Stack)

```java
public static boolean isBalanced(String s) {
    Stack<Character> stack = new Stack<>();

    for (char ch : s.toCharArray()) {
        if (ch == '(' || ch == '{' || ch == '[') {
            stack.push(ch);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (ch == ')' && top != '(') return false;
            if (ch == '}' && top != '{') return false;
            if (ch == ']' && top != '[') return false;
        }
    }

    return stack.isEmpty();
}
```

### Template 18: Sliding Window Maximum (Deque)

```java
public static int[] maxSlidingWindow(int[] arr, int k) {
    int n = arr.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Remove outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements
        while (!deque.isEmpty() && arr[deque.peekLast()] < arr[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        if (i >= k - 1) {
            result[i - k + 1] = arr[deque.peekFirst()];
        }
    }

    return result;
}
```

---

## 🎯 PATTERN RECOGNITION KEYWORDS

| Keyword in Problem            | Pattern to Use          | Complexity   |
| ----------------------------- | ----------------------- | ------------ |
| "every window of size K"      | Sliding Window          | O(N×K)       |
| "all possibilities"           | Backtracking            | O(2^N)       |
| "pair sum", "two elements"    | Two Pointers            | O(N)         |
| "prime number"                | isPrime with √N         | O(√N)        |
| "digit sum", "digit product"  | Digit extraction        | O(log N)     |
| "position of", "count of"     | Linear scan + counter   | O(N)         |
| "range [a, b]"                | Loop: i=a; i<=b         | O(N)         |
| **"GCD", "LCM"**              | **Euclidean Algorithm** | **O(log N)** |
| **"XOR", "power of 2"**       | **Bit Manipulation**    | **O(1)**     |
| **"balanced", "parentheses"** | **Stack**               | **O(N)**     |
| **"spiral", "rotate matrix"** | **Matrix Traversal**    | **O(M×N)**   |

---

## 🔑 JAVA COLLECTIONS QUICK REFERENCE

### ArrayList

```java
ArrayList<Integer> list = new ArrayList<>();
list.add(10);                    // Add to end - O(1)
list.get(0);                     // Access - O(1)
list.remove(list.size() - 1);    // Remove last - O(1)
list.size();                     // Get size - O(1)
Collections.sort(list);          // Sort - O(N log N)
```

### HashMap

```java
HashMap<Integer, Integer> map = new HashMap<>();
map.put(5, 10);                  // Insert - O(1)
map.get(5);                      // Retrieve - O(1)
map.containsKey(5);              // Check key - O(1)
map.getOrDefault(5, 0);          // Get or default - O(1)
```

### Stack (NEW!)

```java
Stack<Integer> stack = new Stack<>();
stack.push(10);                  // Add to top - O(1)
stack.pop();                     // Remove from top - O(1)
stack.peek();                    // View top - O(1)
stack.isEmpty();                 // Check if empty - O(1)
```

### Deque (NEW!)

```java
Deque<Integer> deque = new ArrayDeque<>();
deque.offerFirst(10);            // Add to front - O(1)
deque.offerLast(20);             // Add to back - O(1)
deque.pollFirst();               // Remove from front - O(1)
deque.pollLast();                // Remove from back - O(1)
deque.peekFirst();               // View front - O(1)
deque.peekLast();                // View back - O(1)
```

### StringBuilder

```java
StringBuilder sb = new StringBuilder();
sb.append("text");               // Add - O(1)
sb.append(123);                  // Add number - O(1)
String result = sb.toString();   // Convert - O(N)
```

---

## ⏱️ TIME ALLOCATION (90 min for 2 questions)

### Per Question (45 minutes):

- **5 min:** Read + understand constraints
- **5 min:** Plan approach + identify pattern
- **25 min:** Code implementation
- **10 min:** Test with examples + edge cases

### Priority if Running Out of Time:

1. Validation code (MUST HAVE)
2. Basic logic for main cases
3. Edge case handling
4. Optimization (SKIP if no time)

---

## 🎯 MINIMUM TO PASS (60% Score)

### Must Solve Completely:

- 1 easy/medium question: 100% test cases (40 marks)
- 1 medium question: 50% test cases (10 marks)
- MCQs: 70% correct (10 marks)
- **Total: 60/100 ✓**

### How to Get There:

- Focus on boundary conditions (fixes 50% of failures)
- Always validate input (fixes 30% of failures)
- Use brute force if needed (correct > optimal)

---

## 📚 MUST KNOW BEFORE EXAM

### 🎯 PATTERN RECOGNITION TABLE (All 20 Patterns)

| #      | Pattern              | Keywords                                      | Complexity           |
| ------ | -------------------- | --------------------------------------------- | -------------------- |
| 1      | Sliding Window       | "window", "subarray of size k", "consecutive" | O(N)                 |
| 2      | Two Pointers         | "pair sum", "palindrome", "sorted array"      | O(N)                 |
| 3      | Frequency Count      | "anagram", "character count", "duplicates"    | O(N)                 |
| 4      | Prefix Sum           | "range sum", "subarray sum", "cumulative"     | O(N)                 |
| 5      | StringBuilder        | "string concatenation", "build string"        | O(N)                 |
| 6      | Array Rotation       | "rotate array", "reverse segments"            | O(N)                 |
| 7      | Dutch Flag           | "sort 0s 1s 2s", "3-way partition"            | O(N)                 |
| 8      | Kadane's             | "maximum subarray sum", "contiguous sum"      | O(N)                 |
| 9      | Binary Search        | "sorted", "search in rotated", "find target"  | O(log N)             |
| 10     | Recursion            | "all subsets", "permutations", "divide"       | O(2^N) or O(N log N) |
| 11     | Backtracking         | "generate all", "N-Queens", "combinations"    | O(2^N)               |
| 12     | Divide & Conquer     | "merge sort", "quick sort", "divide in half"  | O(N log N)           |
| **13** | **Greedy**           | "maximize", "minimize", "activity selection"  | O(N log N)           |
| **14** | **Math**             | "GCD", "LCM", "prime", "divisor"              | O(√N)                |
| **15** | **Bit Manipulation** | "XOR", "power of 2", "set bits", "swap"       | O(1) to O(log N)     |
| **16** | **Matrix**           | "2D array", "spiral", "rotate", "traverse"    | O(M×N)               |
| **17** | **Stack**            | "balanced", "next greater", "histogram"       | O(N)                 |
| **18** | **Queue/Deque**      | "sliding max", "stream", "FIFO"               | O(N)                 |
| **19** | **DP Basics**        | "fibonacci", "stairs", "overlapping"          | O(N)                 |
| **20** | **String Algos**     | "pattern match", "anagram", "rolling hash"    | O(N+M)               |

**Bold patterns (13-20) are newly added!**

---

### Arrays

- Access: `arr[i]` is O(1)
- Length: `arr.length` (property, no parentheses)
- Valid indices: 0 to `arr.length - 1`
- Default values: 0 for int, false for boolean

### Strings

- Immutable: can't change after creation
- Compare: use `s1.equals(s2)`, NOT `s1 == s2`
- Length: `s.length()` (method, with parentheses)
- Char at: `s.charAt(i)` returns char, not String

### Loops

- Inclusive range [a, b]: `for (int i = a; i <= b; i++)`
- Array traversal: `for (int i = 0; i < n; i++)`
- Sliding window: `for (int i = 0; i <= n - k; i++)`

---

## 💡 MENTAL SHORTCUTS

### Loop Boundary Check:

Draw the last iteration:

- If you want to include `end`, use `i <= end`
- If you want to exclude `end`, use `i < end`
- Default for ranges: INCLUSIVE both ends

### Prime Check:

- Only need to check up to √N
- Why? If N = a×b and a > √N, then b < √N
- Code: `i * i <= num` (no need for Math.sqrt)

### Sliding Window Count:

- Array size N, window size K
- Number of windows = N - K + 1
- Last window starts at index N - K

---

## 🚨 RED FLAGS (Stop and Fix Immediately)

### If You Write This:

- `for (int i = start + 1; ...)` → Should be `i = start`
- `for (int i = 0; i < n - k; ...)` → Should be `i <= n - k`
- `for (int i = 2; i < num/2; ...)` → Should be `i * i <= num`
- No input validation → ADD IT NOW
- `String + String` in loop → Use StringBuilder
- `if (s1 == s2)` for strings → Use `s1.equals(s2)`

---

## ⚠️ COMMON PITFALLS & TRAPS

### Pitfall 1: Scanner After Loop

```java
// ❌ WRONG
for (int i = 0; i < n; i++) {
    arr[i] = sc.nextInt();
}
sc.nextLine();  // Don't do this in Netcracker!
String s = sc.nextLine();  // May not work

// ✅ CORRECT
for (int i = 0; i < n; i++) {
    arr[i] = sc.nextInt();
}
int x = sc.nextInt();  // Stick to nextInt()
```

**Why:** Online judges don't always handle mixed input well. Stick to one input method per problem.

---

### Pitfall 2: Integer Overflow

```java
// ❌ WRONG
int sum = 0;
for (int i = 0; i < n; i++) {
    sum += arr[i];  // If arr has large values, sum overflows!
}

// ✅ CORRECT
long sum = 0;  // Use long for sums
for (int i = 0; i < n; i++) {
    sum += arr[i];
}
System.out.println((int)sum);  // Cast back if needed
```

**When to use:** Array sums, factorials, products

---

### Pitfall 3: String Comparison

```java
// ❌ WRONG
String s1 = "abc";
String s2 = new String("abc");
if (s1 == s2) { ... }  // FALSE! Compares references

// ✅ CORRECT
if (s1.equals(s2)) { ... }  // TRUE! Compares content
```

**Always use `.equals()` for strings!**

---

### Pitfall 4: Array Index Out of Bounds

```java
// ❌ WRONG: Off-by-one error
for (int i = 0; i <= n; i++) {  // Will crash at i=n
    arr[i] = sc.nextInt();
}

// ❌ WRONG: Sliding window
for (int i = 0; i < n; i++) {  // Will crash when i+k exceeds n
    for (int j = i; j < i + k; j++) {
        sum += arr[j];
    }
}

// ✅ CORRECT
for (int i = 0; i < n; i++) {  // i goes 0 to n-1
    arr[i] = sc.nextInt();
}

// ✅ CORRECT: Sliding window
for (int i = 0; i <= n - k; i++) {  // Stops at right position
    for (int j = i; j < i + k; j++) {
        sum += arr[j];
    }
}
```

---

### Pitfall 5: Modifying Collection While Iterating

```java
// ❌ WRONG
ArrayList<Integer> list = new ArrayList<>();
// ... add elements ...
for (int num : list) {
    if (num < 0) {
        list.remove(num);  // ConcurrentModificationException!
    }
}

// ✅ CORRECT: Use Iterator
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() < 0) {
        it.remove();
    }
}

// ✅ CORRECT: Backward loop for indices
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i) < 0) {
        list.remove(i);
    }
}
```

---

### Pitfall 6: Empty Array/List Assumption

```java
// ❌ WRONG: Assumes at least one element
int max = arr[0];  // Crashes if arr is empty!
for (int i = 1; i < n; i++) {
    if (arr[i] > max) max = arr[i];
}

// ✅ CORRECT: Validate first
if (n == 0) {
    System.out.println("Invalid Input");
    return;
}
int max = arr[0];
for (int i = 1; i < n; i++) {
    if (arr[i] > max) max = arr[i];
}
```

---

### Pitfall 7: Digit Extraction Sign Issue

```java
// ❌ WRONG: Doesn't handle negative
int num = -123;
while (num > 0) {  // Loop never runs!
    int digit = num % 10;
    // ...
}

// ✅ CORRECT
int num = -123;
num = Math.abs(num);  // Convert to positive first
while (num > 0) {
    int digit = num % 10;
    // ...
}
```

---

### Pitfall 8: Counter Timing (Your Q1 Bug!)

```java
// ❌ WRONG
int counter = 1;
for (int i = 2; i < n; i++) {
    if (isPrime(i)) {
        System.out.println(counter);  // Prints BEFORE incrementing!
        counter++;
    }
}

// ✅ CORRECT
int counter = 1;
for (int i = 2; i < n; i++) {
    if (isPrime(i)) {
        counter++;  // Increment FIRST
        System.out.println(counter);
    }
}
```

---

### Pitfall 9: Premature Loop Break

```java
// ❌ WRONG: Q2 logic
for (int i = 0; i <= n - k; i++) {
    boolean hasNegative = false;
    for (int j = i; j < i + k; j++) {
        if (arr[j] < 0) {
            System.out.println(arr[j]);
            break;  // Stops checking rest of windows!
        }
    }
}

// ✅ CORRECT: Use flag properly
for (int i = 0; i <= n - k; i++) {
    boolean found = false;
    for (int j = i; j < i + k; j++) {
        if (arr[j] < 0) {
            System.out.println(arr[j]);
            found = true;
            break;  // Exit INNER loop only
        }
    }
    if (!found) {
        System.out.println("No Numbers");
    }
}
```

---

### Pitfall 10: Forgetting ZERO Case

```java
// ❌ WRONG: Pattern printing
if (n < 0) {
    System.out.println("Invalid Input");
    return;
}
// What if n = 0? Prints nothing silently!

// ✅ CORRECT
if (n == 0) {
    System.out.println("ZERO");
    return;
}
if (n < 0) {
    System.out.println("Invalid Input");
    return;
}
```

---

## 🎉 CONFIDENCE BOOSTERS

### Remember:

1. You already attempted 3/5 questions (better than 50% of candidates)
2. Your logic is sound (just boundary bugs)
3. Netcracker tests precision, not genius
4. 60% = PASS = JOB OPPORTUNITY
5. You have the preparation - trust the process

### Last 5 Minutes Before Exam:

- Deep breath
- Review validation template
- Review loop boundaries
- Trust your preparation
- You've got this! 🚀

---

## 📞 QUICK HELP DURING EXAM

### Stuck on Pattern Recognition?

- Read problem again
- Look for keywords: "window", "all", "range", "prime"
- Match to pattern table above
- If still stuck: try brute force

### Failing Test Cases?

- 80% of time: boundary conditions
- Check: loop start/end, array indices
- Check: inclusive vs exclusive ranges
- Check: counter increment timing

### Running Out of Time?

- Ensure validation is complete
- Implement brute force (correct > fast)
- Skip optimization
- Test with 1-2 examples only

---

# 🚀 YOU'RE READY! GO ACE THAT EXAM! 🚀
