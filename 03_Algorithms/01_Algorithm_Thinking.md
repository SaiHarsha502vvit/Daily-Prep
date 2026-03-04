> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_Sorting_Algorithms.md)

# 🧠 Algorithm Thinking: How to Approach Any Problem

## Learning the LOGIC, Not Just the Code

---

# PART 0: COMPLETE UNDERSTANDING + GROWTH MINDSET

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         ALGORITHM THINKING - COMPLETE UNDERSTANDING & GROWTH MINDSET          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS ALGORITHMIC THINKING?                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Algorithmic thinking is a METHOD of thinking about problems that involves:  │
│ • Breaking problems into SMALLER, manageable parts                           │
│ • Finding PATTERNS across different problems                                  │
│ • Creating STEP-BY-STEP solutions                                            │
│ • GENERALIZING solutions to apply broadly                                    │
│                                                                              │
│ KEY INSIGHT: It's NOT about memorizing algorithms - it's about developing   │
│ a THINKING PROCESS that lets you CREATE solutions.                           │
│                                                                              │
│ HISTORICAL PERSPECTIVE:                                                      │
│ • 300 BC: Euclid's GCD algorithm (first recorded algorithm)                 │
│ • 820 AD: Al-Khwarizmi (the word "algorithm" comes from his name!)          │
│ • 1936: Alan Turing - formalized what "computable" means                    │
│ • 1960s: Structured programming - algorithms became science                 │
│ • Today: Millions of algorithms, but THINKING process is universal!         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES ALGORITHMIC THINKING SOLVE?                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Humans naturally think in vague, incomplete ways.              │
│ Computers need PRECISE, COMPLETE instructions.                               │
│                                                                              │
│ HUMAN INSTRUCTION: "Sort these numbers"                                      │
│ COMPUTER NEEDS:                                                              │
│   1. What does "sorted" mean? (ascending? descending?)                       │
│   2. What type of numbers? (integers? decimals? negative?)                   │
│   3. What if there are duplicates?                                           │
│   4. What if empty?                                                          │
│   5. EXACT steps to compare and arrange                                      │
│                                                                              │
│ ALGORITHMIC THINKING bridges this gap!                                       │
│                                                                              │
│ REAL-WORLD APPLICATIONS:                                                     │
│ • Google Search: Rank billions of pages in milliseconds                      │
│ • GPS: Find best route among millions of possibilities                       │
│ • Netflix: Recommend from thousands of shows                                 │
│ • Compression: Make files smaller without losing data                        │
│ • Encryption: Secure communication across internet                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ THE GROWTH MINDSET FOR CREATING YOUR OWN ALGORITHMS ⭐                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ "I can ONLY use algorithms I've learned" ← FIXED MINDSET                    │
│ "I can CREATE algorithms for new problems" ← GROWTH MINDSET                 │
│                                                                              │
│ THE TRUTH: Every algorithm was INVENTED by someone facing a new problem!    │
│                                                                              │
│ HOW ALGORITHMS GET INVENTED:                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1. OBSERVATION: "I keep doing the same work repeatedly"                 │ │
│ │        ↓                                                                 │ │
│ │ 2. QUESTION: "Can I eliminate this repetition?"                         │ │
│ │        ↓                                                                 │ │
│ │ 3. EXPERIMENT: "What if I store/precompute/organize differently?"       │ │
│ │        ↓                                                                 │ │
│ │ 4. GENERALIZE: "This works for other problems too!"                     │ │
│ │        ↓                                                                 │ │
│ │ 5. PATTERN BORN: Now it's a named algorithm!                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ YOU CAN DO THIS TOO!                                                         │
│                                                                              │
│ EXAMPLE - How you might "invent" Sliding Window:                             │
│ Problem: "Find max sum of 3 consecutive elements"                            │
│ Brute force: For each start, sum next 3 elements → O(n*k)                   │
│                                                                              │
│ OBSERVATION: "I'm adding same numbers multiple times!"                       │
│   sum(0,1,2) = a + b + c                                                    │
│   sum(1,2,3) = b + c + d  ← I already know b+c from previous!              │
│                                                                              │
│ INVENTION: "Instead of re-summing, I'll ADD new - REMOVE old!"              │
│   sum(1,2,3) = sum(0,1,2) - a + d  → O(n)!                                  │
│                                                                              │
│ CONGRATULATIONS: You just "invented" Sliding Window! 🎉                      │
│                                                                              │
│ THE SECRET: Every algorithm is just this process applied!                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW TO DEVELOP ALGORITHM CREATION SKILLS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. ALWAYS START WITH BRUTE FORCE                                             │
│    "What's the simplest way to solve this?"                                  │
│    Don't worry about efficiency first - get CORRECT solution                │
│                                                                              │
│ 2. IDENTIFY THE WASTE                                                        │
│    "Where am I repeating work?"                                              │
│    "What am I computing multiple times?"                                     │
│    "What information am I not using?"                                        │
│                                                                              │
│ 3. ASK THE MAGIC QUESTIONS                                                   │
│    "Can I precompute something?"                                             │
│    "Can I sort first?"                                                       │
│    "Can I use extra space to save time?"                                    │
│    "Can I process while reading input?"                                     │
│    "Can I divide the problem?"                                               │
│                                                                              │
│ 4. LOOK FOR STRUCTURE                                                        │
│    "Is there ordering I can exploit?"                                        │
│    "Is there hierarchy/tree structure?"                                      │
│    "Are there independent subproblems?"                                      │
│    "Are there overlapping subproblems?"                                      │
│                                                                              │
│ 5. COMBINE KNOWN TECHNIQUES                                                  │
│    Binary Search + Greedy = Optimization                                     │
│    HashMap + Sliding Window = Substring problems                             │
│    DFS + Memoization = Tree DP                                              │
│                                                                              │
│ 6. TEST AND REFINE                                                           │
│    Does it work for edge cases?                                              │
│    Can it be simpler?                                                        │
│    Can it be faster?                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ CREATING YOUR OWN DATA STRUCTURES                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ SAME GROWTH MINDSET APPLIES!                                                 │
│                                                                              │
│ EXAMPLE - How LRU Cache was "invented":                                      │
│ PROBLEM: Cache with limited space, need to decide what to remove            │
│                                                                              │
│ OBSERVATION: "Most recently used items are more likely to be used again"    │
│                                                                              │
│ NEED: Fast lookup (HashMap) + Fast ordering (LinkedList)                    │
│                                                                              │
│ INVENTION: Combine HashMap + DoublyLinkedList!                              │
│   HashMap: O(1) lookup of any item                                           │
│   LinkedList: O(1) move-to-front and remove-from-back                       │
│                                                                              │
│ RESULT: LRU Cache - a NEW DATA STRUCTURE from combining existing ones!      │
│                                                                              │
│ YOUR TURN - Try these exercises:                                             │
│ • Can you create a "MinStack" (stack with O(1) getMin)?                     │
│ • Can you create a "MaxQueue" (queue with O(1) getMax)?                     │
│ • Can you create a "FrequencyStack" (pop most frequent element)?           │
│                                                                              │
│ HINT: Combine existing structures + maintain extra state!                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN ALGORITHMIC THINKING                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. JUMPING TO CODE TOO FAST:                                                 │
│    Want to code immediately without thinking                                 │
│    Solution: Force yourself to write solution in WORDS first                │
│                                                                              │
│ 2. NOT SEEING PATTERNS:                                                      │
│    Each problem feels unique and new                                         │
│    Solution: After solving, ask "What similar problems use this?"           │
│                                                                              │
│ 3. ANALYSIS PARALYSIS:                                                       │
│    Overthinking, trying to find optimal solution immediately                │
│    Solution: Solve brute force first, THEN optimize                         │
│                                                                              │
│ 4. FEAR OF INEFFICIENCY:                                                     │
│    "This solution is O(n²), it must be wrong"                               │
│    Solution: Check constraints! O(n²) for n=100 is FINE                     │
│                                                                              │
│ 5. MEMORIZING VS UNDERSTANDING:                                              │
│    Memorizing solutions doesn't help with new problems                       │
│    Solution: For each solution, understand WHY it works                     │
│                                                                              │
│ 6. GIVING UP TOO EARLY:                                                      │
│    "I don't know the algorithm for this"                                    │
│    Solution: YOU can create the algorithm! Use the process above.           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF ALGORITHMIC THINKING                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ PROBLEM DECOMPOSITION: Break any problem into smaller pieces             │
│ ✅ PATTERN RECOGNITION: See connections across different problems           │
│ ✅ MULTIPLE APPROACHES: Generate several solutions, pick best               │
│ ✅ COMPLEXITY ANALYSIS: Predict time/space before coding                    │
│ ✅ EDGE CASE AWARENESS: Naturally think about boundaries                    │
│ ✅ OPTIMIZATION PATH: Know how to improve brute force                       │
│ ✅ CONFIDENCE: "I can figure this out even if I haven't seen it before"    │
│                                                                              │
│ THE ULTIMATE OUTPUT:                                                         │
│ Transform from "I need to know the algorithm" to                            │
│                 "I can CREATE the algorithm"                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: THE UNIVERSAL PROBLEM-SOLVING FRAMEWORK

## Step-by-Step Thinking Process

```
┌────────────────────────────────────────────────────────────┐
│                  THE 5-STEP FRAMEWORK                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   1. UNDERSTAND 📖                                         │
│      └─ What is the input? Output? Constraints?           │
│                                                            │
│   2. EXAMPLES 📝                                           │
│      └─ Work through 2-3 examples by hand                 │
│                                                            │
│   3. BRUTE FORCE 💪                                        │
│      └─ What's the simplest (maybe slow) solution?        │
│                                                            │
│   4. OPTIMIZE 🚀                                           │
│      └─ Where is the repetition? Can we save work?        │
│                                                            │
│   5. CODE 💻                                               │
│      └─ Translate logic to code                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

# PART 2: PATTERN RECOGNITION

## How to Identify Which Algorithm to Use

### Decision Tree for Common Problems

```
                    START
                      │
          ┌──────────┴──────────┐
          │ Is data SORTED?     │
          └──────────┬──────────┘
                 YES │ NO
           ┌─────────┴─────────┐
           │                   │
    Binary Search      ┌───────┴───────┐
    Two Pointers       │ Need OPTIMAL  │
                       │ substructure? │
                       └───────┬───────┘
                           YES │ NO
                      ┌────────┴────────┐
                      │                 │
               Dynamic           ┌──────┴──────┐
               Programming       │ Searching/  │
                                │ Traversing? │
                                └──────┬──────┘
                                   YES │
                            ┌──────────┴──────────┐
                            │                     │
                    Tree/Graph?           Array/String?
                        │                       │
                   BFS / DFS              Sliding Window
                                         Two Pointers
                                         HashMap
```

### Keyword → Pattern Mapping

| Keywords in Problem                   | Think About            |
| ------------------------------------- | ---------------------- |
| "subarray", "substring", "contiguous" | Sliding Window         |
| "sorted array", "search"              | Binary Search          |
| "pairs", "two elements"               | Two Pointers / HashMap |
| "shortest path", "minimum steps"      | BFS                    |
| "all paths", "all combinations"       | DFS / Backtracking     |
| "connected components"                | Union-Find / DFS       |
| "minimum/maximum", "optimal"          | DP / Greedy            |
| "top K", "Kth largest/smallest"       | Heap                   |
| "frequency", "count", "duplicate"     | HashMap                |
| "sorted order", "BST property"        | TreeMap / BST          |
| "parentheses", "nested"               | Stack                  |
| "level by level"                      | BFS                    |

---

# PART 3: THE THINKING PROCESS FOR EACH PATTERN

## 1. Two Pointers Thinking

### When to Think Two Pointers

```
SIGNAL PHRASES:
- "Find two elements that..."
- "Sorted array"
- "Remove duplicates"
- "Reverse"
- "Palindrome"

MENTAL MODEL:
┌─────────────────────────────────────────┐
│ Instead of checking ALL pairs O(n²)     │
│                                         │
│ Use TWO pointers that MOVE based on     │
│ some CONDITION                          │
│                                         │
│ left →────────────────────────── ← right│
│                                         │
│ Movement reduces search space!          │
└─────────────────────────────────────────┘
```

### Thinking Example: Container With Most Water

```
PROBLEM:
Heights: [1, 8, 6, 2, 5, 4, 8, 3, 7]
Find max water between two lines.

BRUTE FORCE THINKING:
"Check every pair of lines"
for i in range(n):
    for j in range(i+1, n):
        water = min(height[i], height[j]) * (j - i)
        max_water = max(max_water, water)
Time: O(n²) ❌

TWO POINTER THINKING:
"Start with widest container (left and right edges)"
"Which pointer should I move?"

INSIGHT:
- Water limited by SHORTER line
- If I move the taller line, water can only DECREASE (width shrinks)
- If I move the shorter line, water MIGHT increase (might find taller)

So: ALWAYS MOVE THE SHORTER LINE!

left = 0, right = n-1
while left < right:
    water = min(height[left], height[right]) * (right - left)
    if height[left] < height[right]:
        left++
    else:
        right--
Time: O(n) ✓
```

---

## 2. Sliding Window Thinking

### When to Think Sliding Window

```
SIGNAL PHRASES:
- "Subarray/substring of size K"
- "Longest/shortest subarray with condition"
- "Consecutive elements"
- "Sum of K elements"

MENTAL MODEL:
┌─────────────────────────────────────────┐
│ Instead of recalculating for each       │
│ starting position...                     │
│                                         │
│ SLIDE a window and UPDATE incrementally │
│                                         │
│ [1, 2, 3, 4, 5, 6, 7, 8]              │
│  └─────┘                window size 3   │
│     └─────┘              slide right    │
│        └─────┘           slide right    │
│                                         │
│ Add new element, remove old element     │
└─────────────────────────────────────────┘
```

### Fixed vs Variable Window

```
FIXED WINDOW (Size K given):
- Initialize: sum of first K elements
- Slide: add new, remove old
- Example: Maximum average of K elements

VARIABLE WINDOW (Condition given):
- Expand until condition breaks
- Shrink until condition satisfied
- Track best result

VARIABLE WINDOW TEMPLATE:
left = 0
for right in range(n):
    # EXPAND: add arr[right] to window

    while (condition violated):
        # SHRINK: remove arr[left]
        left++

    # UPDATE: result with current window
```

### Thinking Example: Longest Substring Without Repeating

```
PROBLEM:
s = "abcabcbb"
Find longest substring without repeating characters.

BRUTE FORCE THINKING:
"Check every substring, verify no repeats"
for i in range(n):
    for j in range(i+1, n+1):
        if all_unique(s[i:j]):
            max_len = max(max_len, j - i)
Time: O(n³) ❌

SLIDING WINDOW THINKING:
"Expand window until I see a repeat"
"When repeat found, shrink from left until no repeat"

Window: "abc" → add 'a' → repeat found!
Shrink until 'a' removed: "bca"
Continue expanding...

INSIGHT:
Use SET to track characters in window
When repeat, shrink until that char removed

seen = set()
left = 0
max_len = 0

for right in range(n):
    while s[right] in seen:
        seen.remove(s[left])
        left++
    seen.add(s[right])
    max_len = max(max_len, right - left + 1)

Time: O(n) ✓
```

---

## 3. Binary Search Thinking

### When to Think Binary Search

```
SIGNAL PHRASES:
- "Sorted array"
- "Find target"
- "Search in O(log n)"
- "Find first/last occurrence"
- "Find minimum/maximum that satisfies condition"

MENTAL MODEL:
┌─────────────────────────────────────────┐
│ Can I eliminate HALF the search space   │
│ with one comparison?                    │
│                                         │
│ YES → Binary Search possible!           │
│                                         │
│ [1, 3, 5, 7, 9, 11, 13, 15]           │
│              ↑                          │
│           middle                        │
│                                         │
│ Target < middle → search LEFT half     │
│ Target > middle → search RIGHT half    │
└─────────────────────────────────────────┘
```

### Binary Search Variants

```
VARIANT 1: Exact Match
"Find element equal to target"
→ Standard binary search

VARIANT 2: First Occurrence
"Find first element >= target"
→ When found, DON'T STOP! Search left for earlier

VARIANT 3: Last Occurrence
"Find last element <= target"
→ When found, DON'T STOP! Search right for later

VARIANT 4: Search on Answer
"Find minimum K such that condition(K) is true"
→ Binary search on K values, not array!
```

### Thinking Example: Find Peak Element

```
PROBLEM:
nums = [1, 2, 3, 1]
Find any peak element (greater than neighbors).

LINEAR THINKING:
"Check each element against neighbors"
for i in range(n):
    if nums[i] > neighbors:
        return i
Time: O(n) - but can we do better?

BINARY SEARCH THINKING:
"Can I eliminate half with one comparison?"

INSIGHT:
At middle, if nums[mid] < nums[mid+1]:
  → Peak MUST be on right side (going UP)

If nums[mid] > nums[mid+1]:
  → Peak MUST be on left side or AT mid (going DOWN)

left = 0, right = n-1
while left < right:
    mid = (left + right) / 2
    if nums[mid] < nums[mid + 1]:
        left = mid + 1  # Peak is right
    else:
        right = mid     # Peak is left or here

return left  # left == right, found peak

Time: O(log n) ✓
```

---

## 4. Dynamic Programming Thinking

### When to Think DP

```
SIGNAL PHRASES:
- "How many ways..."
- "Minimum/maximum cost/profit"
- "Is it possible..."
- "Count all..."
- "Optimal solution"

DP DETECTION:
1. Overlapping subproblems?
   (Same calculation repeated)
2. Optimal substructure?
   (Optimal solution built from optimal sub-solutions)

If BOTH yes → DP!
```

### DP Recipe

```
STEP 1: Define State
"What variables describe a subproblem?"
dp[i] = answer for first i elements
dp[i][j] = answer using i items with capacity j

STEP 2: Find Recurrence
"How does dp[i] relate to smaller subproblems?"
dp[i] = dp[i-1] + dp[i-2]  (Fibonacci)
dp[i] = max(dp[j] + arr[i]) for all j < i  (LIS)

STEP 3: Identify Base Cases
"What are the smallest subproblems I know?"
dp[0] = 1, dp[1] = 1  (Climbing stairs)

STEP 4: Determine Order
"In what order should I fill the table?"
Usually left-to-right, top-to-bottom

STEP 5: Extract Answer
"Where in the table is my final answer?"
dp[n] or max(dp) or dp[n][W]
```

### Thinking Example: House Robber

```
PROBLEM:
houses = [2, 7, 9, 3, 1]
Can't rob adjacent houses. Maximize profit.

BRUTE FORCE THINKING:
"Try all combinations of non-adjacent houses"
2^n combinations → O(2ⁿ) ❌

DP THINKING:
"At each house, I have TWO choices:
 1. Rob it (can't rob previous)
 2. Skip it (keep previous money)"

DEFINE STATE:
dp[i] = max money robbing houses 0 to i

RECURRENCE:
dp[i] = max(
    dp[i-2] + houses[i],  // Rob house i
    dp[i-1]               // Skip house i
)

BASE CASES:
dp[0] = houses[0]  // Rob first house
dp[1] = max(houses[0], houses[1])  // Better of first two

FILL TABLE:
houses = [2, 7, 9, 3, 1]
dp[0] = 2
dp[1] = max(2, 7) = 7
dp[2] = max(7, 2+9) = 11
dp[3] = max(11, 7+3) = 11
dp[4] = max(11, 11+1) = 12

ANSWER: dp[4] = 12 ✓
```

---

## 5. BFS/DFS Thinking

### When to Think BFS

```
SIGNAL PHRASES:
- "Shortest path"
- "Minimum steps"
- "Level by level"
- "Nearest"

BFS = LEVEL ORDER TRAVERSAL
- Explores all nodes at distance 1
- Then all at distance 2
- Then all at distance 3...

MENTAL MODEL:
Think of dropping a stone in water
The ripples spread OUTWARD evenly
```

### When to Think DFS

```
SIGNAL PHRASES:
- "All paths"
- "All combinations"
- "Detect cycle"
- "Connected components"
- "Backtracking"

DFS = GO DEEP FIRST
- Explore as far as possible
- Backtrack when stuck
- Try another path

MENTAL MODEL:
Think of solving a maze
Go until dead end
Back up and try different path
```

### Thinking Example: Number of Islands

```
PROBLEM:
grid = [
  ['1','1','0','0'],
  ['1','1','0','0'],
  ['0','0','1','0'],
  ['0','0','0','1']
]
Count number of islands.

THINKING PROCESS:
"An island is a group of connected '1's"
"If I find a '1', I need to mark ALL connected '1's as visited"
"Then count how many times I start a new search"

BFS or DFS?
- Don't need shortest path
- Need to explore all connected cells
- Either works! DFS is simpler.

ALGORITHM:
count = 0
for each cell (i, j):
    if cell is '1':
        count++
        DFS to mark all connected '1's as visited

DFS Function:
def dfs(i, j):
    if out of bounds or grid[i][j] != '1':
        return
    grid[i][j] = '0'  # Mark visited
    dfs(i+1, j)  # Down
    dfs(i-1, j)  # Up
    dfs(i, j+1)  # Right
    dfs(i, j-1)  # Left

Time: O(m × n) ✓
```

---

# PART 4: COMMON THINKING MISTAKES

## Mistake 1: Jumping to Code

```
❌ WRONG:
See problem → Start typing code

✓ RIGHT:
See problem → Understand → Examples → Brute force → Optimize → Code

"10 minutes of planning saves 1 hour of debugging"
```

## Mistake 2: Not Considering Edge Cases

```
ALWAYS CHECK:
- Empty input: [], ""
- Single element: [1], "a"
- All same: [5,5,5,5]
- Already sorted: [1,2,3,4]
- Reverse sorted: [4,3,2,1]
- Negative numbers: [-1,-2,-3]
- Maximum values: [10^9, 10^9]
```

## Mistake 3: Off-by-One Errors

```
COMMON PITFALLS:
- Array index: 0 to n-1, not 1 to n
- Loop bounds: < n vs <= n
- Substring: end index exclusive
- Middle calculation: (left + right) / 2 vs left + (right - left) / 2

PREVENTION:
- Trace through with small example
- Check boundary conditions explicitly
```

## Mistake 4: Overcomplicating

```
❌ WRONG:
"This must need a complex algorithm"

✓ RIGHT:
"What's the simplest thing that could work?"

REMEMBER:
- Brute force is a VALID starting point
- Sometimes O(n²) is acceptable
- Optimize only if needed
```

---

# PART 5: PRACTICE METHODOLOGY

## The 4-Phase Learning

```
PHASE 1: SEE (Day 1)
- Read problem and solution
- Understand the logic
- NO coding yet!

PHASE 2: DO (Day 2)
- Try to solve without looking
- Refer to notes if stuck
- Implement solution

PHASE 3: TEACH (Day 3)
- Explain solution out loud
- Write the thinking process
- Identify key insights

PHASE 4: APPLY (Day 4+)
- Solve similar problems
- Recognize the pattern
- Apply with variations
```

## Time Boxing

```
BEGINNER (Week 1-2):
- 30 min to understand
- 30 min to implement
- Look at solution if stuck after 30 min
- Learn from solution

INTERMEDIATE (Week 3-4):
- 20 min to think
- 25 min to implement
- 15 min to optimize
- Total: 60 min per problem

ADVANCED (Week 5+):
- 10 min to think
- 20 min to implement
- 5 min to verify
- Total: 35 min per problem
```

---

# PART 6: INTERVIEW THINKING OUT LOUD

## The STAR Format for Problem Solving

```
S - STATE the problem
    "I need to find..."

T - THINK through approaches
    "I'm considering two approaches..."
    "Brute force would be O(n²) because..."
    "I can optimize using..."

A - ANNOUNCE your plan
    "I'll use a sliding window because..."
    "Here's my plan: First I'll... Then I'll..."

R - REVIEW as you code
    "This loop handles..."
    "This condition checks for..."
    "Let me trace through an example..."
```

## Sample Think-Aloud

```
PROBLEM: Two Sum

"Okay, so I need to find two numbers that add up to a target.

Let me think about brute force first. I could check every pair of numbers -
that would be O(n²). Not great for large inputs.

How can I do better? For each number, I need to find its complement.
If I could look up the complement in O(1)... I can use a HashMap!

So my plan is:
1. Create an empty HashMap
2. For each number, check if (target - number) is in the map
3. If yes, return the indices
4. If no, add current number to map

Let me trace through [2, 7, 11, 15] with target 9:
- i=0: complement is 7, not in map, add 2→0
- i=1: complement is 2, YES in map! Return [0, 1]

That looks correct. Time is O(n), space is O(n).

Let me code this up..."
```

---

_Practice this thinking framework every day!_ 🧠
