# What Problem Does Monotonic Stack Solve

> **Navigation**: [Chapter overview](../15_Monotonic_Stack_Queue_Complete.md) | [Sliding Window Maximum/Minimum →](02_sliding_window_maximum_minimum.md)
> Page 1 of 3 in **Monotonic Stack & Queue Complete Guide**


**Core Problem**: For each element in an array, find the NEXT (or PREVIOUS)
element that is GREATER (or SMALLER). This appears EVERYWHERE.
BRUTE FORCE vs MONOTONIC STACK
Array: [73, 74, 75, 71, 69, 72, 76, 73]
Question: "How many days until a warmer temperature?"

**Brute Force**: For each day, scan forward until warmer found.
Day 0 (73): check 74 → warmer! → 1 day
Day 1 (74): check 75 → warmer! → 1 day
Day 2 (75): check 71,69,72,76 → 76 warmer! → 4 days
Day 3 (71): check 69,72 → 72 warmer! → 2 days
...
For each element, scan up to n elements: O(n²)
n=100K → 10 BILLION operations → ~10 seconds ❌

**Monotonic Stack**: Process each element ONCE. When an element arrives,
pop all smaller elements (they found their answer = current element).
Each element pushed once, popped once: TOTAL = O(n)
n=100K → 200K operations → <1 millisecond ✅

💡 **WHY O(n)? THE KEY INSIGHT:**
Each element enters the stack exactly ONCE.
Each element leaves the stack at most ONCE.
Total push + pop operations = 2n = O(n).
Despite the while loop INSIDE the for loop, it's NOT O(n²)!
(Amortized analysis: each element pays for its own push and pop.)

🔬 **Section Challenge — What Problem Does Monotonic Stack Solve**

**Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?

<details><summary>Answer</summary>

In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.

</details>

## Real-World Origin Story

1984 — LARGEST RECTANGLE IN HISTOGRAM:
Computational geometry researchers needed to find the largest axis-aligned
rectangle in a histogram (bar chart). Brute force was O(n²).
Someone realized: "Keep a stack of increasing heights. When a shorter
bar arrives, pop and calculate rectangle with the popped height."
Result: O(n) algorithm! This became THE classic monotonic stack problem.
2000s — COMPETITIVE PROGRAMMING EXPLOSION:
Monotonic stack became a core technique in contests (IOI, ACM-ICPC).
Dozens of seemingly different problems share this core pattern:

- Stock Price Span (finance: days since price was this low)
- Trapping Rain Water (civil engineering: water accumulation)
- Buildings With Sunset View (architecture: visibility)
  TODAY — INDUSTRY USES:
- Real-time dashboards: Sliding window max over streaming data
- Financial analysis: Stock span, volatility tracking
- Computer vision: Local maxima/minima detection in signal processing
- Web rendering: CSS stacking context resolution
- Game engines: Visibility calculation (which buildings can you see?)

## The Mental Model: The Bouncer At A Nightclub

MONOTONIC DECREASING STACK (for Next Greater Element):
Imagine a bouncer maintaining a LINE of people sorted by HEIGHT.
When a NEW person arrives:

1. Anyone in line SHORTER than new person gets kicked out.
   (They just found their "next greater" = the new person!)
2. The new person joins the end of the line.

**Full Walkthrough**: arr = [2, 1, 4, 3, 5]
Step 1: Process 2 Stack: [2] Line: just 2 standing
No one to kick out. 2 enters line.
Step 2: Process 1 Stack: [2, 1] Line: 2 then 1
1 < 2, so 1 stands behind 2. No one kicked out.
Step 3: Process 4 Stack: [4] Kicks: 1→NGE=4, 2→NGE=4
4 arrives. 1 < 4 → kicked! (NGE of 1 = 4)
2 < 4 → kicked! (NGE of 2 = 4)
4 enters empty line.
Step 4: Process 3 Stack: [4, 3] 3 stands behind 4
3 < 4, no one kicked. 3 enters.
Step 5: Process 5 Stack: [5] Kicks: 3→NGE=5, 4→NGE=5
5 kicks out 3 (NGE=5) and 4 (NGE=5). 5 enters.
Final: 5 has no NGE → -1
Result: NGE = [4, 4, 5, 5, -1]

**Total**: 5 pushes + 5 pops = 10 operations = O(2n) = O(n) ✅

## The Complete Variant Table

| You need | Use this |
| -------- | -------- |
| Next Greater Element | Monotonic **decreasing** stack, scan L→R |
| Next Smaller Element | Monotonic **increasing** stack, scan L→R |
| Previous Greater Element | Monotonic **decreasing** stack, scan L→R |
| Previous Smaller Element | Monotonic **increasing** stack, scan L→R |
| Sliding Window Max | Monotonic **decreasing** deque |
| Sliding Window Min | Monotonic **increasing** deque |
| Largest Rectangle in Histogram | Monotonic **increasing** stack (heights) |
| Trapping Rain Water | Monotonic **decreasing** stack (heights) |

> [!TIP]
> **Memory trick for increasing vs decreasing:**
>
> - Want **greater**? Keep **smaller** ones waiting → **decreasing** stack.
> - Want **smaller**? Keep **greater** ones waiting → **increasing** stack.
> - Think: *"What I'm KEEPING is the OPPOSITE of what I'm LOOKING FOR."*

**Previous vs next:**

- For **next**: the answer is found when the element is **popped** (something bigger came).
- For **previous**: the answer is the element **on top** after pushing the current one.
- The direction can also change by scanning R→L instead of L→R.
SIGNAL WORDS in interviews:
"next greater/smaller", "span", "visible buildings/people",
"sliding window max/min", "histogram", "trapping water/rain",
"stock price span", "days until warmer", "sum of subarray minimums"

```java
// NEXT GREATER ELEMENT — Universal Template
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);           // Default: no greater element found
    Deque<Integer> stack = new ArrayDeque<>();  // Stores INDICES

    for (int i = 0; i < n; i++) {
        // Pop all elements SMALLER than current (they found their NGE!)
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];  // Current element is their NGE
        }
        stack.push(i);                     // Current enters the line
    }
    // Remaining in stack have no NGE → already -1
    return result;
}
// Time: O(n) — each element pushed once, popped once
// Space: O(n) — stack + result array

// VARIANT: PREVIOUS SMALLER ELEMENT
public int[] prevSmaller(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // INCREASING stack

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) {
            stack.pop();  // Remove elements >= current
        }
        if (!stack.isEmpty()) result[i] = arr[stack.peek()]; // Top is prev smaller
        stack.push(i);
    }
    return result;
}
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ BENCHMARK: BRUTE FORCE vs MONOTONIC STACK                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Next Greater Element for n elements:                                         │
│                                                                              │
│ ┌─────────────┬───────────────┬───────────────────────────────────────┐      │
│ │ n           │ Brute O(n²)  │ Monotonic Stack O(n)                  │       │
│ ├─────────────┼───────────────┼───────────────────────────────────────┤      │
│ │ 100         │ 0.01 ms      │ 0.001 ms                              │       │
│ │ 1,000       │ 1 ms         │ 0.01 ms                               │       │
│ │ 10,000      │ 100 ms       │ 0.1 ms                                │       │
│ │ 100,000     │ 10 sec       │ 1 ms           (10,000x faster!)     │        │
│ │ 1,000,000   │ 17 min       │ 10 ms          (100,000x faster!)    │        │
│ │ 10,000,000  │ ~28 hours    │ 100 ms         (1,000,000x faster!)  │        │
│ └─────────────┴───────────────┴───────────────────────────────────────┘      │
│                                                                              │
│ INTERVIEW CONSTRAINTS:                                                       │
│   n ≤ 10⁵ → must be O(n) or O(n log n) → monotonic stack is key              │
│   If you see "next greater" + n ≤ 10⁵ → monotonic stack, not brute force.    │
│                                                                              │
│ CPU INSIGHT:                                                                 │
│ • Stack operations are cache-friendly (top of stack stays in L1 cache)       │
│ • Sequential array scan → CPU prefetcher predicts next access                │
│ • Much faster in practice than even O(n log n) sort-based approaches         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES & HOW TO AVOID THEM                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Increasing vs Decreasing confusion                                │
│   "Next Greater" → you want bigger to pop smaller → DECREASING stack         │
│   "Next Smaller" → you want smaller to pop bigger → INCREASING stack         │
│   Fix: Think "what do I KEEP in the stack?" Keep what HASN'T found answer.   │
│                                                                              │
│ MISTAKE 2: Storing values instead of INDICES                                 │
│   If you store values, you can't fill the result array!                      │
│   Fix: ALWAYS push INDICES. Access values via arr[stack.peek()].             │
│                                                                              │
│ MISTAKE 3: Off-by-one in "Previous" problems                                 │
│   For previous smaller/greater, the answer is stack.peek() BEFORE pushing.   │
│   Don't confuse with "next" problems where answer is found during popping.   │
│                                                                              │
│ MISTAKE 4: Forgetting circular array case                                    │
│   "Next Greater Element II" uses circular array.                             │
│   Fix: Process the array TWICE (i = 0 to 2n-1, index = i % n).               │
│   Only push during first pass.                                               │
│                                                                              │
│ MISTAKE 5: Using wrong comparison (< vs <=)                                  │
│   For "strictly greater": use <  (pop when stack value < current)            │
│   For "greater or equal": use <= (pop when stack value <= current)           │
│   This matters in "Number of Visible People in a Queue" and similar.         │
│                                                                              │
│ MISTAKE 6: Not using Deque for Sliding Window problems                       │
│   Sliding window needs removal from BOTH ends → use Deque, not Stack.        │
│   Remove from front: expired elements (out of window).                       │
│   Remove from back: elements that can no longer be answer (smaller/bigger).  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING MONOTONIC STACK                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "HOW CAN A WHILE LOOP INSIDE A FOR LOOP BE O(n)?"                         │
│    Each element is pushed exactly once and popped at most once.              │
│    Total pushes = n, total pops ≤ n. Total work = 2n = O(n).                 │
│    The while loop doesn't always run! It fires only when popping happens.    │
│                                                                              │
│ 2. "WHEN DO I USE STACK vs DEQUE?"                                           │
│    Stack: "Next/Previous Greater/Smaller" — only need one end.               │
│    Deque: "Sliding Window Max/Min" — need to expire old elements from front  │
│    Rule: If there's a WINDOW SIZE → Deque. Otherwise → Stack.                │
│                                                                              │
│ 3. "LARGEST RECTANGLE IN HISTOGRAM IS CONFUSING"                             │
│    Key insight: For each bar, the rectangle width extends to the             │
│    previous smaller bar (left boundary) and next smaller bar (right).        │
│    Use increasing stack: when shorter bar arrives, popped bar knows its      │
│    right boundary (current) and left boundary (new stack top).               │
│    Practice: draw the histogram and trace the stack step by step.            │
│                                                                              │
│ 4. "SUM OF SUBARRAY MINIMUMS SEEMS IMPOSSIBLY HARD"                          │
│    Break it down: for each element, find how many subarrays it's minimum of  │
│    That count = (distance to prev smaller) × (distance to next smaller).     │
│    Use monotonic stack to find both distances. Then sum: val × count.        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING MONOTONIC STACK ⭐                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT RECOGNITION: See "next greater" → Monotonic Stack                  │
│ ✅ Can write NGE/NSE/PGE/PSE templates from memory                            │
│ ✅ Can solve Largest Rectangle in Histogram in 10 minutes                     │
│ ✅ Understand amortized O(n) proof (push once, pop once)                      │
│ ✅ Know when to use Stack vs Deque (window → Deque)                           │
│ ✅ Handle circular arrays (process 2n with i%n)                               │
│ ✅ Solve contribution-counting problems (Sum of Subarray Mins/Maxs)           │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I'll check every pair — O(n²) is fine for now"                        │
│   TO: "Monotonic stack gives me next greater/smaller in O(n).                │
│        I keep a [decreasing/increasing] stack and process linearly."         │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related mental models:**

- [14_Mental_Models/05_Universal_Problem_Framework.md](../../14_Mental_Models/05_Universal_Problem_Framework.md) — Pattern recognition for O(n) problems
- [14_Mental_Models/05_Universal_Problem_Framework.md](../../14_Mental_Models/05_Universal_Problem_Framework.md) — How monotonic stack optimizes away nested loops

---

## Fundamentals <a name="fundamentals"></a>

### What is Monotonic Stack/Queue?

```
╔═══════════════════════════════════════════════════════════════╗
║              MONOTONIC DATA STRUCTURES                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  MONOTONIC STACK: A stack where elements are always in        ║
║  increasing or decreasing order from bottom to top.           ║
║                                                               ║
║  MONOTONIC QUEUE: A deque where elements are always in        ║
║  increasing or decreasing order.                              ║
║                                                               ║
║  WHY USE THEM?                                                ║
║  • Find next/previous greater/smaller element in O(n)         ║
║  • Sliding window max/min in O(n) total                       ║
║  • Reduce O(n²) brute force to O(n)                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Visual Comparison

```
Regular Stack:              Monotonic Decreasing Stack:
┌─────┐                     ┌─────┐
│  3  │ ← top               │  7  │ ← top (smallest)
├─────┤                     ├─────┤
│  7  │                     │  5  │
├─────┤                     ├─────┤
│  2  │                     │  3  │
├─────┤                     └─────┘   (largest at bottom)
│  5                              │
└─────┘  (random order)

Monotonic Increasing Stack:
┌─────┐
│  2  │ ← top (largest)
├─────┤
│  4  │
├─────┤
│  7  │
└─────┘   (smallest at bottom)
```

### The Key Insight

```
┌─────────────────────────────────────────────────────────────────┐
│              MONOTONIC STACK KEY INSIGHT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When we POP an element, we've found its answer!                │
│                                                                 │
│  For Next Greater Element:                                      │
│  - Use DECREASING stack (larger pops smaller)                   │
│  - When we pop: current element IS the next greater             │
│                                                                 │
│  For Next Smaller Element:                                      │
│  - Use INCREASING stack (smaller pops larger)                   │
│  - When we pop: current element IS the next smaller             │
│                                                                 │
│  "Pop = Found the answer for the popped element"                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monotonic Stack Basics <a name="monotonic-stack"></a>

### Building a Monotonic Decreasing Stack

```java
/*
Maintain elements in decreasing order from bottom to top.
When a larger element comes, pop smaller ones.
*/

public void buildMonotonicDecreasing(int[] nums) {
    Deque<Integer> stack = new ArrayDeque<>();

    for (int num : nums) {
        // Pop elements smaller than current
        while (!stack.isEmpty() && stack.peek() < num) {
            int popped = stack.pop();
            System.out.println(popped + " has next greater: " + num);
        }
        stack.push(num);
    }

    // Remaining elements have no next greater
    while (!stack.isEmpty()) {
        System.out.println(stack.pop() + " has no next greater");
    }
}
```

### Visual: How Monotonic Stack Works

```
Array: [2, 1, 5, 6, 2, 3]
Finding: Next Greater Element

Process step by step:

i=0, num=2:
    Stack: []
    Push 2
    Stack: [2]

i=1, num=1:
    Stack: [2]
    1 < 2, just push
    Stack: [2, 1]

i=2, num=5:
    Stack: [2, 1]
    5 > 1, pop 1 → Next greater of 1 is 5
    5 > 2, pop 2 → Next greater of 2 is 5
    Stack: []
    Push 5
    Stack: [5]

i=3, num=6:
    Stack: [5]
    6 > 5, pop 5 → Next greater of 5 is 6
    Push 6
    Stack: [6]

i=4, num=2:
    Stack: [6]
    2 < 6, just push
    Stack: [6, 2]

i=5, num=3:
    Stack: [6, 2]
    3 > 2, pop 2 → Next greater of 2 is 3
    3 < 6, stop
    Push 3
    Stack: [6, 3]

Final: 6, 3 have no next greater → -1

Result: [5, 5, 6, -1, 3, -1]
```

---

## Next Greater Element Pattern <a name="next-greater"></a>

### Template: Next Greater Element

```java
/*
For each element, find the next greater element to its right.
Use DECREASING stack (stores indices).
*/

public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);

    Deque<Integer> stack = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Pop all elements smaller than current
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            int idx = stack.pop();
            result[idx] = nums[i];  // Current is next greater for popped
        }
        stack.push(i);
    }

    return result;
}
```

### Next Greater Element I (LeetCode 496)

```java
/*
nums1 is subset of nums2.
For each element in nums1, find its next greater in nums2.
*/

public int[] nextGreaterElement(int[] nums1, int[] nums2) {
    // Build next greater map for nums2
    Map<Integer, Integer> nextGreater = new HashMap<>();
    Deque<Integer> stack = new ArrayDeque<>();

    for (int num : nums2) {
        while (!stack.isEmpty() && stack.peek() < num) {
            nextGreater.put(stack.pop(), num);
        }
        stack.push(num);
    }

    // Answer for nums1
    int[] result = new int[nums1.length];
    for (int i = 0; i < nums1.length; i++) {
        result[i] = nextGreater.getOrDefault(nums1[i], -1);
    }
    return result;
}
```

### Next Greater Element II - Circular Array (LeetCode 503)

```java
/*
Circular array: After last element, wrap to first.
Trick: Iterate through array TWICE.
*/

public int[] nextGreaterElements(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);

    Deque<Integer> stack = new ArrayDeque<>();

    // Go through array twice for circular behavior
    for (int i = 0; i < 2 * n; i++) {
        int num = nums[i % n];

        while (!stack.isEmpty() && nums[stack.peek()] < num) {
            result[stack.pop()] = num;
        }

        // Only push indices in first pass
        if (i < n) {
            stack.push(i);
        }
    }

    return result;
}
```

### Visual: Circular Array Next Greater

```
Array: [1, 2, 1]  (circular)

Treating as: [1, 2, 1, 1, 2, 1]
                      ↑───────↑ (don't add to result, just for lookup)

i=0: push 0, stack=[0]
i=1: 2 > nums[0]=1, pop 0, result[0]=2, push 1
i=2: 1 < nums[1]=2, push 2, stack=[1,2]
i=3: 1 == nums[2]=1, no pop
i=4: 2 > nums[2]=1, pop 2, result[2]=2
     2 == nums[1]=2, no pop
i=5: done

result = [2, -1, 2]
```

---

## Next Smaller Element Pattern <a name="next-smaller"></a>

### Template: Next Smaller Element

```java
/*
For each element, find the next smaller element to its right.
Use INCREASING stack (stores indices).
*/

public int[] nextSmallerElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);

    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Pop all elements LARGER than current
        while (!stack.isEmpty() && nums[stack.peek()] > nums[i]) {
            int idx = stack.pop();
            result[idx] = nums[i];  // Current is next smaller for popped
        }
        stack.push(i);
    }

    return result;
}
```

### Next Smaller vs Next Greater

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPARISON: GREATER vs SMALLER                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEXT GREATER ELEMENT:                                          │
│  • Use DECREASING stack                                         │
│  • Pop when current > stack.top                                 │
│  • "Larger element kicks out smaller ones"                      │
│                                                                 │
│  NEXT SMALLER ELEMENT:                                          │
│  • Use INCREASING stack                                         │
│  • Pop when current < stack.top                                 │
│  • "Smaller element kicks out larger ones"                      │
│                                                                 │
│  Rule of thumb:                                                 │
│  • Looking for GREATER → maintain DECREASING                    │
│  • Looking for SMALLER → maintain INCREASING                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Daily Temperatures (LeetCode 739)

```java
/*
For each day, find how many days until warmer temperature.
This is "Next Greater Element" but return INDEX DIFFERENCE.
*/

public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];

    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
            int idx = stack.pop();
            result[idx] = i - idx;  // Days until warmer
        }
        stack.push(i);
    }

    return result;  // Unpopped days remain 0 (no warmer day)
}
```

---

## Previous Greater/Smaller <a name="previous"></a>

### Previous Greater Element

```java
/*
For each element, find the previous greater element (to its left).
Process left to right, answer when ADDING to stack.
*/

public int[] previousGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);

    Deque<Integer> stack = new ArrayDeque<>();  // Decreasing stack

    for (int i = 0; i < n; i++) {
        // Pop smaller elements (they won't be previous greater for future)
        while (!stack.isEmpty() && nums[stack.peek()] <= nums[i]) {
            stack.pop();
        }

        // If stack not empty, top is previous greater
        if (!stack.isEmpty()) {
            result[i] = nums[stack.peek()];
        }

        stack.push(i);
    }

    return result;
}
```

### Previous Smaller Element

```java
/*
For each element, find the previous smaller element.
Process left to right, use INCREASING stack.
*/

public int[] previousSmallerElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);

    Deque<Integer> stack = new ArrayDeque<>();  // Increasing stack

    for (int i = 0; i < n; i++) {
        // Pop larger elements
        while (!stack.isEmpty() && nums[stack.peek()] >= nums[i]) {
            stack.pop();
        }

        // If stack not empty, top is previous smaller
        if (!stack.isEmpty()) {
            result[i] = nums[stack.peek()];
        }

        stack.push(i);
    }

    return result;
}
```

### Four Relationships Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              ALL FOUR PATTERNS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEXT GREATER (right):                                          │
│  • Direction: Left → Right                                      │
│  • Stack: Decreasing                                            │
│  • Answer: When POPPING                                         │
│                                                                 │
│  NEXT SMALLER (right):                                          │
│  • Direction: Left → Right                                      │
│  • Stack: Increasing                                            │
│  • Answer: When POPPING                                         │
│                                                                 │
│  PREVIOUS GREATER (left):                                       │
│  • Direction: Left → Right                                      │
│  • Stack: Decreasing                                            │
│  • Answer: When PUSHING (stack top is answer)                   │
│                                                                 │
│  PREVIOUS SMALLER (left):                                       │
│  • Direction: Left → Right                                      │
│  • Stack: Increasing                                            │
│  • Answer: When PUSHING (stack top is answer)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monotonic Queue <a name="monotonic-queue"></a>

### What is Monotonic Queue?

```
╔═══════════════════════════════════════════════════════════════╗
║              MONOTONIC QUEUE                                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  A queue (deque) maintaining monotonic order.                 ║
║                                                               ║
║  Key Operations:                                              ║
║  • Add from back (may pop existing elements)                  ║
║  • Remove from front (when element leaves window)             ║
║  • Get max/min: Front of deque                                ║
║                                                               ║
║  Use case: Sliding window max/min in O(n) total               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Visual: Monotonic Queue for Max

```
Array: [1, 3, -1, -3, 5, 3, 6, 7], window size = 3

We maintain a DECREASING deque (max at front)

Window [1, 3, -1]:
  Add 1: deque = [1]
  Add 3: 3 > 1, pop 1, deque = [3]
  Add -1: -1 < 3, deque = [3, -1]
  Max = 3 (front)

Window [3, -1, -3]:
  Remove 1: 1 not at front, do nothing
  Add -3: -3 < -1, deque = [3, -1, -3]
  Max = 3 (front)

Window [-1, -3, 5]:
  Remove 3: 3 is at front, pop front
  deque = [-1, -3]
  Add 5: 5 > -3 and 5 > -1, pop all
  deque = [5]
  Max = 5 (front)

... and so on
```

---

[Chapter overview](../15_Monotonic_Stack_Queue_Complete.md) | [Sliding Window Maximum/Minimum →](02_sliding_window_maximum_minimum.md)
