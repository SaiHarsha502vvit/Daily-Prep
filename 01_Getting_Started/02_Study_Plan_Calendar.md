**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# 📅 2.5-Month Study Plan — February 19 to May 5, 2026

## Your Daily Roadmap: DS + Algorithm + Combo + Pattern + 2 Questions

## 5W1H — Why This Chapter?

> WHAT: A structured, day-by-day 2.5-month roadmap to interview readiness.
>
> WHY: Unstructured practice leads to burnout and forgotten concepts. A structured syllabus ensures spaced repetition, progressive overload, and coverage of all critical patterns.
>
> WHO: Anyone preparing for software engineering interviews who needs a concrete schedule.
>
> WHEN: Before writing any code, to set expectations, block out time, and establish a daily rhythm.
>
> HOW: By following the daily 5-block structure (DS, Algo, Combo, Pattern, Questions) and respecting the deep dive/review days.

---

**START DATE:** Thursday, February 19, 2026  
**END DATE:** Tuesday, May 5, 2026  
**TOTAL:** 76 Days (11 Weeks)  
**DAILY COMMITMENT:** 3-4 hours weekdays, 5-6 hours weekends

---

## How Each Day Works

Every day follows this structure:

| Block      | What                                                   | Time   |
| ---------- | ------------------------------------------------------ | ------ |
| 📦 DS      | One data structure topic — read, understand, implement | 40 min |
| ⚙️ ALGO    | One algorithm topic — learn the logic, trace on paper  | 40 min |
| 🔗 COMBO   | A problem that combines today's DS + Algo together     | 30 min |
| 🧩 PATTERN | A coding pattern/technique to recognize and practice   | 30 min |
| ❓ Q1 & Q2 | Two basic-to-medium questions (increasing difficulty)  | 40 min |

**Mentor Tip:** Don't just solve — UNDERSTAND. Trace every solution on paper before coding. If you can't explain it to a rubber duck, you don't know it yet.

---

## Difficulty Progression

| Weeks | Level          | What to Expect                                                      |
| ----- | -------------- | ------------------------------------------------------------------- |
| 1-3   | 🟢 Easy        | Foundations. Build muscle memory. Most problems solvable in <15 min |
| 4-6   | 🟡 Easy-Medium | Core patterns emerge. Problems need 15-25 min thinking              |
| 7-8   | 🟠 Medium      | Trees, Graphs, DP basics. Need paper + pen                          |
| 9-10  | 🔴 Medium-Hard | Advanced patterns. Combine multiple techniques                      |
| 11    | 🟣 Integration | Mock interviews, SQL, system design. Full circle                    |

---

## File Reference Key

| Symbol | Meaning                      |
| ------ | ---------------------------- |
| 📘     | Read this file               |
| 💻     | Code this problem            |
| 📝     | Take written notes           |
| 🎯     | Focus — this is the priority |
| 🔁     | Review / Redo from earlier   |

---

# PHASE 1: FOUNDATIONS (Week 1-3)

_"You don't build a house starting from the roof. Arrays, Strings, and Loops are your concrete foundation."_

---

## 📆 WEEK 1: Feb 19-25 — Arrays + Basic Algorithms + Loop Patterns

### Day 1 — Thu, Feb 19 🟢

| Block      | Topic                                     | Details                                                  |
| ---------- | ----------------------------------------- | -------------------------------------------------------- |
| 📦 DS      | **Array Basics**                          | Declaration, traversal, insertion, deletion              |
| ⚙️ ALGO    | **Linear Search**                         | Search element one-by-one, understand O(n)               |
| 🔗 COMBO   | Find element in array and return index    | Combine array traversal + linear search                  |
| 🧩 PATTERN | **Brute Force / Complete Search**         | Try all possibilities — the starting point of everything |
| ❓ Q1      | Find the maximum element in an array      | _Easy — single pass_                                     |
| ❓ Q2      | Count occurrences of a number in an array | _Easy — frequency counting intro_                        |

📘 Read: [02_Data_Structures/01a_Memory_Foundations.md](../02_Data_Structures/01a_Memory_Foundations.md) — Arrays section  
📘 Read: [03_Algorithms/01_Algorithm_Thinking.md](../03_Algorithms/01_Algorithm_Thinking.md) — How to approach problems

**Mentor Note:** Today is Day 1. Don't rush. Understand WHY arrays are indexed from 0. Understand WHY linear search is O(n). These "obvious" things become your vocabulary.

---

### Day 2 — Fri, Feb 20 🟢

| Block      | Topic                                         | Details                            |
| ---------- | --------------------------------------------- | ---------------------------------- |
| 📦 DS      | **Array Operations**                          | Reverse, rotate, shift elements    |
| ⚙️ ALGO    | **Frequency Counting**                        | Use array/map to count occurrences |
| 🔗 COMBO   | Find duplicate in array using frequency count | DS (array) + Algo (counting)       |
| 🧩 PATTERN | **Star Patterns** — Square, Right Triangle    | Loop mastery through visual output |
| ❓ Q1      | Reverse an array in-place                     | _Easy — swap technique_            |
| ❓ Q2      | Check if array is sorted                      | _Easy — compare adjacent_          |

📘 Read: [03_Algorithms/09_Pattern_Programs_Complete.md](../03_Algorithms/09_Pattern_Programs_Complete.md) — Part 1 (Star Patterns)

**Mentor Note:** Pattern programs teach you loop control. Don't skip them. Every `for` loop mistake in interviews traces back to weak loop fundamentals.

---

### Day 3 — Sat, Feb 21 🟢 (Deep Dive Day)

| Block      | Topic                                | Details                       |
| ---------- | ------------------------------------ | ----------------------------- |
| 📦 DS      | **Array — Prefix Sum concept**       | Running total technique       |
| ⚙️ ALGO    | **Selection Sort**                   | Find minimum, swap to front   |
| 🔗 COMBO   | Sort array → find median element     | Sort + array indexing         |
| 🧩 PATTERN | **Pyramid + Inverted Pyramid**       | Nested loops with spaces      |
| ❓ Q1      | Find second largest element in array | _Easy — two-pass or one-pass_ |
| ❓ Q2      | Move all zeros to end (LC 283)       | _Easy — two pointer intro_    |

📘 Read: [03_Algorithms/02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md) — Selection Sort section

**Mentor Note:** Weekend = extra time. After solving, try writing Selection Sort from memory 3 times. Muscle memory > reading.

---

### Day 4 — Sun, Feb 22 🟢 (Deep Dive Day)

| Block      | Topic                                       | Details                                     |
| ---------- | ------------------------------------------- | ------------------------------------------- |
| 📦 DS      | **String Basics**                           | charAt, length, substring, immutability     |
| ⚙️ ALGO    | **Bubble Sort**                             | Compare adjacent, bubble up largest         |
| 🔗 COMBO   | Sort characters of a string alphabetically  | Convert string → char array → sort → string |
| 🧩 PATTERN | **Character Patterns** — Alphabet triangles | Apply loop logic to characters              |
| ❓ Q1      | Reverse a string                            | _Easy — two pointers or StringBuilder_      |
| ❓ Q2      | Check if string is palindrome               | _Easy — compare from both ends_             |

📘 Read: [02_Data_Structures/01a_Memory_Foundations.md](../02_Data_Structures/01a_Memory_Foundations.md) — Strings section  
📘 Read: [03_Algorithms/09_Pattern_Programs_Complete.md](../03_Algorithms/09_Pattern_Programs_Complete.md) — Part 3 (Character Patterns)

---

### Day 5 — Mon, Feb 23 🟢

| Block      | Topic                                                     | Details                                   |
| ---------- | --------------------------------------------------------- | ----------------------------------------- |
| 📦 DS      | **String Operations**                                     | Substring, char arrays, ASCII values      |
| ⚙️ ALGO    | **Insertion Sort**                                        | Insert each element into correct position |
| 🔗 COMBO   | Sort list of strings by length using insertion sort logic | String + sorting                          |
| 🧩 PATTERN | **Number Patterns** — Floyd's Triangle, Pascal's Triangle | Number generation in patterns             |
| ❓ Q1      | Count vowels and consonants in a string                   | _Easy — character check_                  |
| ❓ Q2      | LC 242 — Valid Anagram                                    | _Easy — frequency count on strings_       |

📘 Read: [03_Algorithms/09_Pattern_Programs_Complete.md](../03_Algorithms/09_Pattern_Programs_Complete.md) — Part 2 (Number Patterns)

---

### Day 6 — Tue, Feb 24 🟢

| Block      | Topic                                                  | Details                           |
| ---------- | ------------------------------------------------------ | --------------------------------- |
| 📦 DS      | **2D Array / Matrix basics**                           | Row-column access, traversal      |
| ⚙️ ALGO    | **Binary Search (basic)**                              | Search in sorted array — O(log n) |
| 🔗 COMBO   | Search in a sorted matrix row                          | Matrix + Binary Search            |
| 🧩 PATTERN | **Matrix Traversal** — row-wise, column-wise, diagonal | How to walk through a grid        |
| ❓ Q1      | LC 704 — Binary Search                                 | _Easy — classic implementation_   |
| ❓ Q2      | Find row with maximum 1s in binary matrix              | _Easy-Medium_                     |

📘 Read: [02_Data_Structures/04_2D_Arrays_Matrix.md](../02_Data_Structures/04_2D_Arrays_Matrix.md)  
📘 Read: [04_Patterns_Templates/06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md) — Introduction only

---

### Day 7 — Wed, Feb 25 🟢 (REVIEW DAY)

| Block | Topic                                            |
| ----- | ------------------------------------------------ |
| 🔁    | Revise all Array operations — write from memory  |
| 🔁    | Revise all 3 sorting algorithms — trace on paper |
| 🔁    | Redo any pattern program you struggled with      |
| 💻    | **Timed Practice:** 3 problems in 45 minutes     |
| ❓ Q1 | Rotate array by K positions (LC 189)             |
| ❓ Q2 | First non-repeating character in string (LC 387) |

**Mentor Note:** Review days are NOT optional. Your brain consolidates knowledge during review. If you skip this, Week 2 will feel harder than it should.

---

## 📆 WEEK 2: Feb 26 - Mar 4 — Strings Deep + Sorting Mastery + Two Pointers

### Day 8 — Thu, Feb 26 🟢

| Block      | Topic                                       | Details                                         |
| ---------- | ------------------------------------------- | ----------------------------------------------- |
| 📦 DS      | **StringBuilder**                           | Mutable strings, why it matters for performance |
| ⚙️ ALGO    | **Merge Sort**                              | Divide and conquer, merge step                  |
| 🔗 COMBO   | Sort a string array using merge sort        | Strings + D&C sorting                           |
| 🧩 PATTERN | **Two Pointers — Same Direction**           | Both pointers move forward                      |
| ❓ Q1      | LC 26 — Remove Duplicates from Sorted Array | _Easy — in-place with pointer_                  |
| ❓ Q2      | LC 283 — Move Zeroes                        | _Easy — review with two pointer lens_           |

📘 Read: [03_Algorithms/02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md) — Merge Sort  
📘 Read: [04_Patterns_Templates/07_Two_Pointers_Complete.md](../04_Patterns_Templates/07_Two_Pointers_Complete.md) — Introduction

**Mentor Note:** Merge Sort is your first "real" algorithm. Trace the recursion tree on paper. Draw the merge step. This is where you level up.

---

### Day 9 — Fri, Feb 27 🟢

| Block      | Topic                                  | Details                             |
| ---------- | -------------------------------------- | ----------------------------------- |
| 📦 DS      | **String Comparison**                  | equals, compareTo, equalsIgnoreCase |
| ⚙️ ALGO    | **Quick Sort**                         | Partition logic, pivot selection    |
| 🔗 COMBO   | Sort + Binary Search combined          | Sort array then search efficiently  |
| 🧩 PATTERN | **Two Pointers — Opposite Directions** | Start from both ends, move inward   |
| ❓ Q1      | LC 125 — Valid Palindrome              | _Easy — two pointers classic_       |
| ❓ Q2      | LC 344 — Reverse String                | _Easy — in-place swap_              |

📘 Read: [03_Algorithms/02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md) — Quick Sort

---

### Day 10 — Sat, Feb 28 🟢 (Deep Dive Day)

| Block      | Topic                                             | Details                                 |
| ---------- | ------------------------------------------------- | --------------------------------------- |
| 📦 DS      | **Character Arrays + ASCII**                      | Character manipulation, case conversion |
| ⚙️ ALGO    | **Counting Sort**                                 | Non-comparison based O(n+k) sort        |
| 🔗 COMBO   | Sort string by character frequency                | Frequency array + reconstruction        |
| 🧩 PATTERN | **Frequency Count Pattern**                       | Count occurrences → make decisions      |
| ❓ Q1      | LC 387 — First Unique Character in String         | _Easy — frequency map_                  |
| ❓ Q2      | LC 1 — Two Sum (brute force first, then optimize) | _Easy — foundational_                   |

---

### Day 11 — Sun, Mar 1 🟢 (Deep Dive Day)

| Block      | Topic                                     | Details                                      |
| ---------- | ----------------------------------------- | -------------------------------------------- |
| 📦 DS      | **Jagged Arrays + Array of Arrays**       | Variable-length rows                         |
| ⚙️ ALGO    | **Time & Space Complexity**               | Big O analysis — O(1), O(n), O(n²), O(log n) |
| 🔗 COMBO   | Take brute force O(n²) → optimize to O(n) | Understand the WHY of optimization           |
| 🧩 PATTERN | **Complexity Analysis Pattern**           | Identify bottleneck → improve                |
| ❓ Q1      | LC 169 — Majority Element                 | _Easy — Boyer-Moore voting_                  |
| ❓ Q2      | LC 217 — Contains Duplicate               | _Easy — HashSet intro_                       |

📘 Read: [03_Algorithms/01_Algorithm_Thinking.md](../03_Algorithms/01_Algorithm_Thinking.md) — Complexity analysis section

**Mentor Note:** Today is critical. If you don't understand Big O, you can't explain WHY one solution is better. Interviewers care about this more than the code itself.

---

### Day 12 — Mon, Mar 2 🟡

| Block      | Topic                                     | Details                           |
| ---------- | ----------------------------------------- | --------------------------------- |
| 📦 DS      | **Matrix — Transpose, Rotation**          | In-place matrix operations        |
| ⚙️ ALGO    | **Binary Search — First/Last Occurrence** | Modified BS for duplicates        |
| 🔗 COMBO   | Search in rotated sorted array            | BS variant — tricky but important |
| 🧩 PATTERN | **Binary Search Decision Pattern**        | Left half or right half?          |
| ❓ Q1      | LC 35 — Search Insert Position            | _Easy — BS variant_               |
| ❓ Q2      | LC 34 — Find First and Last Position      | _Medium — two binary searches_    |

📘 Read: [04_Patterns_Templates/06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md)

---

### Day 13 — Tue, Mar 3 🟡

| Block      | Topic                                   | Details                          |
| ---------- | --------------------------------------- | -------------------------------- |
| 📦 DS      | **Matrix — Spiral, Boundary Traversal** | Layer-by-layer processing        |
| ⚙️ ALGO    | **Binary Search on Answer**             | Search for the answer in a range |
| 🔗 COMBO   | Square root using binary search         | BS on answer space               |
| 🧩 PATTERN | **Search Space Reduction Pattern**      | Narrow possibilities each step   |
| ❓ Q1      | LC 54 — Spiral Matrix                   | _Medium — direction tracking_    |
| ❓ Q2      | LC 69 — Sqrt(x)                         | _Easy — BS on answer_            |

---

### Day 14 — Wed, Mar 4 🟡 (REVIEW DAY)

| Block | Topic                                              |
| ----- | -------------------------------------------------- |
| 🔁    | Sorting comparison table — when to use which sort? |
| 🔁    | Binary search — trace all variants on paper        |
| 🔁    | Two pointer problems — redo without looking        |
| ❓ Q1 | LC 75 — Sort Colors (Dutch National Flag)          |
| ❓ Q2 | LC 240 — Search a 2D Matrix II                     |

**Mentor Note:** After 2 weeks, you should be able to: (1) Implement any basic sort from memory, (2) Write binary search without bugs, (3) Reverse array/string without thinking. If not, spend extra time here before moving on.

---

>

## 📆 WEEK 3: Mar 5-11 — Linked List + Recursion Introduction

### Day 15 — Thu, Mar 5 🟡

| Block      | Topic                                       | Details                                       |
| ---------- | ------------------------------------------- | --------------------------------------------- |
| 📦 DS      | **Singly Linked List**                      | Node creation, traversal, concept of pointers |
| ⚙️ ALGO    | **Recursion Basics**                        | Base case, recursive case, call stack         |
| 🔗 COMBO   | Traverse linked list using recursion        | Recursive list printing                       |
| 🧩 PATTERN | **Build From Scratch Pattern**              | Implement DS from zero — no library           |
| ❓ Q1      | Create a linked list and print all elements | _Easy — implementation_                       |
| ❓ Q2      | LC 509 — Fibonacci Number (recursive)       | _Easy — classic recursion_                    |

📘 Read: [02_Data_Structures/02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md) — Linked List section  
📘 Read: [03_Algorithms/03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md) — Part 1

**Mentor Note:** Linked Lists are where most students first feel "lost." Draw boxes with arrows on paper. EVERY. SINGLE. TIME. Visualization is not optional here.

---

### Day 16 — Fri, Mar 6 🟡

| Block      | Topic                                              | Details                           |
| ---------- | -------------------------------------------------- | --------------------------------- |
| 📦 DS      | **Linked List — Insert Operations**                | Insert at head, tail, at position |
| ⚙️ ALGO    | **Recursion — Factorial, Sum of Digits**           | Practice recursive thinking       |
| 🔗 COMBO   | Insert into sorted linked list (maintaining order) | LL traversal + comparison logic   |
| 🧩 PATTERN | **Iterative vs Recursive Pattern**                 | Same problem, two approaches      |
| ❓ Q1      | Count nodes in a linked list                       | _Easy — traversal_                |
| ❓ Q2      | LC 231 — Power of Two (recursive approach)         | _Easy — divide by 2 each time_    |

---

### Day 17 — Sat, Mar 7 🟡 (Deep Dive Day)

| Block      | Topic                                              | Details                               |
| ---------- | -------------------------------------------------- | ------------------------------------- |
| 📦 DS      | **Linked List — Delete Operations**                | Delete from head, tail, by value      |
| ⚙️ ALGO    | **Recursion — Reverse String/Array**               | Recursive reversal logic              |
| 🔗 COMBO   | Reverse a linked list (BOTH recursive + iterative) | The #1 linked list interview question |
| 🧩 PATTERN | **In-Place Reversal Pattern**                      | Reverse without extra space           |
| ❓ Q1      | LC 206 — Reverse Linked List                       | _Easy — must-know_                    |
| ❓ Q2      | LC 21 — Merge Two Sorted Lists                     | _Easy — pointer manipulation_         |

📘 Read: [03_Algorithms/03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md) — Reversal techniques

**Mentor Note:** LC 206 is asked in 80% of interviews. You must be able to write it in under 3 minutes, both iteratively and recursively. Practice until it's automatic.

---

### Day 18 — Sun, Mar 8 🟡 (Deep Dive Day)

| Block      | Topic                                 | Details                             |
| ---------- | ------------------------------------- | ----------------------------------- |
| 📦 DS      | **Linked List — Cycle Detection**     | Floyd's Tortoise and Hare algorithm |
| ⚙️ ALGO    | **GCD — Euclidean Algorithm**         | Recursive GCD, why it works         |
| 🔗 COMBO   | Detect cycle + find cycle start point | Slow-fast pointer math              |
| 🧩 PATTERN | **Slow-Fast Pointer Pattern**         | Two speeds reveal hidden structure  |
| ❓ Q1      | LC 141 — Linked List Cycle            | _Easy — detect cycle_               |
| ❓ Q2      | LC 876 — Middle of the Linked List    | _Easy — slow-fast_                  |

📘 Read: [03_Algorithms/08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md) — Part 1

---

### Day 19 — Mon, Mar 9 🟡

| Block      | Topic                                  | Details                      |
| ---------- | -------------------------------------- | ---------------------------- |
| 📦 DS      | **Doubly Linked List**                 | Two-directional navigation   |
| ⚙️ ALGO    | **LCM, Coprime Check**                 | LCM = (a\*b)/GCD(a,b)        |
| 🔗 COMBO   | Implement LRU-style structure with DLL | DS design thinking           |
| 🧩 PATTERN | **Number Theory Pattern**              | GCD/LCM as building blocks   |
| ❓ Q1      | LC 234 — Palindrome Linked List        | _Easy — slow-fast + reverse_ |
| ❓ Q2      | LC 1071 — GCD of Strings               | _Easy — string + GCD_        |

---

### Day 20 — Tue, Mar 10 🟡

| Block      | Topic                                     | Details                                      |
| ---------- | ----------------------------------------- | -------------------------------------------- |
| 📦 DS      | **Linked List — Advanced**                | Flatten, clone with random pointer (concept) |
| ⚙️ ALGO    | **Prime Numbers + Sieve of Eratosthenes** | Generate all primes up to N                  |
| 🔗 COMBO   | Count prime-valued nodes in a linked list | Combine LL traversal + prime check           |
| 🧩 PATTERN | **Precompute/Sieve Pattern**              | Build lookup table first, then query O(1)    |
| ❓ Q1      | LC 204 — Count Primes                     | _Medium — sieve_                             |
| ❓ Q2      | LC 160 — Intersection of Two Linked Lists | _Easy — two pointer on LL_                   |

📘 Read: [03_Algorithms/08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md) — Part 3

---

### Day 21 — Wed, Mar 11 🟡 (REVIEW DAY)

| Block | Topic                                                |
| ----- | ---------------------------------------------------- |
| 🔁    | Linked list — implement all operations from memory   |
| 🔁    | Recursion — trace call stack on paper for 3 problems |
| 🔁    | GCD/LCM — solve 3 problems without reading           |
| ❓ Q1 | LC 83 — Remove Duplicates from Sorted List           |
| ❓ Q2 | LC 203 — Remove Linked List Elements                 |

**Mentor Note:** End of Phase 1. You should now be comfortable with: Arrays, Strings, Matrices, 3 sorting algorithms, Binary Search, Linked Lists, Basic Recursion, GCD/Primes. If any of these feel shaky, STOP and spend 1 extra day before moving to Phase 2.

---

> **Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```

Why and what are the 3 fixes?

<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.

</details>

# PHASE 2: CORE PATTERNS (Week 4-6)

_"Now you know the ingredients. Phase 2 teaches you the recipes — Stack, Queue, HashMap, Trees, and the patterns that connect everything."_

---

## 📆 WEEK 4: Mar 12-18 — Stack & Queue + HashMap Intro

### Day 22 — Thu, Mar 12 🟡

| Block      | Topic                                        | Details                                |
| ---------- | -------------------------------------------- | -------------------------------------- |
| 📦 DS      | **Stack — Concept + Array Implementation**   | LIFO, push, pop, peek                  |
| ⚙️ ALGO    | **Modular Arithmetic**                       | (a+b)%m, (a\*b)%m, applications        |
| 🔗 COMBO   | Evaluate simple expression using stack       | DS meets algo                          |
| 🧩 PATTERN | **LIFO Pattern**                             | Last processed first — undo, backtrack |
| ❓ Q1      | LC 20 — Valid Parentheses                    | _Easy — stack classic_                 |
| ❓ Q2      | LC 1281 — Subtract Product and Sum of Digits | _Easy — digit extraction_              |

📘 Read: [02_Data_Structures/02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md) — Stack section  
📘 Read: [03_Algorithms/08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md) — Part 4 (Modular)

---

### Day 23 — Fri, Mar 13 🟡

| Block      | Topic                            | Details                              |
| ---------- | -------------------------------- | ------------------------------------ |
| 📦 DS      | **Stack — Applications**         | Next Greater Element, stock span     |
| ⚙️ ALGO    | **Modular Exponentiation**       | Fast power in O(log n)               |
| 🔗 COMBO   | Next Greater Element using stack | Monotonic stack concept              |
| 🧩 PATTERN | **Monotonic Stack Pattern**      | Maintain increasing/decreasing order |
| ❓ Q1      | LC 496 — Next Greater Element I  | _Easy — stack + map_                 |
| ❓ Q2      | LC 155 — Min Stack               | _Medium — auxiliary stack_           |

📘 Read: [03_Algorithms/15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md) — Introduction

---

### Day 24 — Sat, Mar 14 🟡 (Deep Dive Day)

| Block      | Topic                                 | Details                        |
| ---------- | ------------------------------------- | ------------------------------ |
| 📦 DS      | **Queue — Concept + Circular Queue**  | FIFO, enqueue, dequeue         |
| ⚙️ ALGO    | **Prefix Sum Technique**              | Precompute cumulative sums     |
| 🔗 COMBO   | Range sum query using prefix sum      | Instant range queries          |
| 🧩 PATTERN | **Prefix Sum Pattern**                | O(n) preprocess → O(1) queries |
| ❓ Q1      | LC 303 — Range Sum Query (Immutable)  | _Easy — prefix sum_            |
| ❓ Q2      | LC 232 — Implement Queue using Stacks | _Easy — design_                |

📘 Read: [02_Data_Structures/02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md) — Queue section

---

### Day 25 — Sun, Mar 15 🟡 (Deep Dive Day)

| Block      | Topic                                    | Details                      |
| ---------- | ---------------------------------------- | ---------------------------- |
| 📦 DS      | **Priority Queue / Heap concept**        | Min-Heap, Max-Heap idea      |
| ⚙️ ALGO    | **Kadane's Algorithm**                   | Maximum subarray sum in O(n) |
| 🔗 COMBO   | Maximum subarray sum problem             | Classic DP/greedy hybrid     |
| 🧩 PATTERN | **Running Calculation Pattern**          | Track best answer as you go  |
| ❓ Q1      | LC 53 — Maximum Subarray                 | _Medium — Kadane_            |
| ❓ Q2      | LC 121 — Best Time to Buy and Sell Stock | _Easy — track min so far_    |

**Mentor Note:** Kadane's algorithm is beautiful. It teaches you that sometimes keeping a "running best" is all you need. This idea will come back in DP.

---

### Day 26 — Mon, Mar 16 🟡

| Block      | Topic                               | Details                        |
| ---------- | ----------------------------------- | ------------------------------ |
| 📦 DS      | **HashMap — put, get, containsKey** | Key-value storage O(1) average |
| ⚙️ ALGO    | **Two Pointer Technique (formal)**  | When and how to use it         |
| 🔗 COMBO   | Two Sum using HashMap (optimal)     | O(n) with map lookup           |
| 🧩 PATTERN | **Map Lookup Pattern**              | Trade space for time           |
| ❓ Q1      | LC 1 — Two Sum (optimal)            | _Easy — HashMap solution_      |
| ❓ Q2      | LC 167 — Two Sum II (sorted input)  | _Medium — two pointers_        |

📘 Read: [04_Patterns_Templates/07_Two_Pointers_Complete.md](../04_Patterns_Templates/07_Two_Pointers_Complete.md)

---

### Day 27 — Tue, Mar 17 🟡

| Block      | Topic                                     | Details                       |
| ---------- | ----------------------------------------- | ----------------------------- |
| 📦 DS      | **HashSet — Uniqueness checking**         | add, contains, O(1) lookup    |
| ⚙️ ALGO    | **Dutch National Flag (3-way partition)** | Sort 0s, 1s, 2s               |
| 🔗 COMBO   | Find duplicates using HashSet             | Set-based duplicate detection |
| 🧩 PATTERN | **Partition Pattern**                     | Divide array into groups      |
| ❓ Q1      | LC 217 — Contains Duplicate               | _Easy — HashSet_              |
| ❓ Q2      | LC 349 — Intersection of Two Arrays       | _Easy — Set operations_       |

---

### Day 28 — Wed, Mar 18 🟡 (REVIEW DAY)

| Block | Topic                                            |
| ----- | ------------------------------------------------ |
| 🔁    | Stack — implement from scratch, solve 3 problems |
| 🔁    | Queue — implement circular queue from scratch    |
| 🔁    | HashMap/HashSet — when to use which?             |
| ❓ Q1 | LC 225 — Implement Stack using Queues            |
| ❓ Q2 | LC 560 — Subarray Sum Equals K                   |

**Mentor Note:** LC 560 combines prefix sum + HashMap. If you can solve it, you've truly understood both concepts. If not, review Day 24 and Day 26.

---

## 📆 WEEK 5: Mar 19-25 — Hashing Deep + Sliding Window

### Day 29 — Thu, Mar 19 🟡

| Block      | Topic                                 | Details                     |
| ---------- | ------------------------------------- | --------------------------- |
| 📦 DS      | **HashMap — Frequency Map, Grouping** | Count freq, group by key    |
| ⚙️ ALGO    | **Sliding Window — Fixed Size**       | Window of K elements        |
| 🔗 COMBO   | Maximum sum of subarray of size K     | Fixed window + running sum  |
| 🧩 PATTERN | **Fixed Sliding Window Pattern**      | Slide window, update answer |
| ❓ Q1      | LC 49 — Group Anagrams                | _Medium — HashMap grouping_ |
| ❓ Q2      | Max sum subarray of size K (practice) | _Easy — window technique_   |

📘 Read: [04_Patterns_Templates/01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md) — Fixed window section

**Mentor Note:** Sliding Window is a TOP interview pattern. Learn the template today, and you'll use it for 20+ problems.

---

### Day 30 — Fri, Mar 20 🟡

| Block      | Topic                                                 | Details                                   |
| ---------- | ----------------------------------------------------- | ----------------------------------------- |
| 📦 DS      | **HashMap — One-Pass vs Two-Pass**                    | Optimize by combining loops               |
| ⚙️ ALGO    | **Sliding Window — Variable Size**                    | Expand right, shrink left                 |
| 🔗 COMBO   | Longest substring without repeating characters        | Variable window + HashSet                 |
| 🧩 PATTERN | **Variable Sliding Window Pattern**                   | Expand until invalid → shrink until valid |
| ❓ Q1      | LC 3 — Longest Substring Without Repeating Characters | _Medium — window + set_                   |
| ❓ Q2      | LC 219 — Contains Duplicate II                        | _Easy — window + map_                     |

📘 Read: [04_Patterns_Templates/01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md) — Variable window section

---

### Day 31 — Sat, Mar 21 🟠 (Deep Dive Day)

| Block      | Topic                                  | Details                        |
| ---------- | -------------------------------------- | ------------------------------ |
| 📦 DS      | **TreeMap, LinkedHashMap**             | Sorted keys, insertion order   |
| ⚙️ ALGO    | **Sliding Window — with Counter/Map**  | Track frequencies in window    |
| 🔗 COMBO   | Minimum window substring               | Hardest sliding window problem |
| 🧩 PATTERN | **Shrinking Window Pattern**           | Find minimum valid window      |
| ❓ Q1      | LC 76 — Minimum Window Substring       | _Hard — but important pattern_ |
| ❓ Q2      | LC 438 — Find All Anagrams in a String | _Medium — fixed window + freq_ |

**Mentor Note:** LC 76 is hard, but don't skip it. Even understanding the approach (without solving perfectly) teaches the pattern. Come back to it in Week 10 and it'll click.

---

### Day 32 — Sun, Mar 22 🟡 (Deep Dive Day)

| Block      | Topic                                | Details                           |
| ---------- | ------------------------------------ | --------------------------------- |
| 📦 DS      | **Java Collections Deep Dive**       | List, Set, Map interfaces         |
| ⚙️ ALGO    | **Merge Intervals**                  | Sort by start → merge overlapping |
| 🔗 COMBO   | Use sorting + scanning for intervals | Sort + linear scan                |
| 🧩 PATTERN | **Interval Pattern**                 | Sort → compare adjacent → merge   |
| ❓ Q1      | LC 56 — Merge Intervals              | _Medium — sort + merge_           |
| ❓ Q2      | LC 57 — Insert Interval              | _Medium — find position + merge_  |

📘 Read: [02_Data_Structures/03_Collections_Java.md](../02_Data_Structures/03_Collections_Java.md)

---

### Day 33 — Mon, Mar 23 🟠

| Block      | Topic                                              | Details                         |
| ---------- | -------------------------------------------------- | ------------------------------- |
| 📦 DS      | **Deque (Double-Ended Queue)**                     | Add/remove from both ends       |
| ⚙️ ALGO    | **Sliding Window Maximum**                         | Track max in window efficiently |
| 🔗 COMBO   | Max of all subarrays of size K using deque         | Monotonic deque                 |
| 🧩 PATTERN | **Monotonic Deque Pattern**                        | Maintain order in deque         |
| ❓ Q1      | LC 239 — Sliding Window Maximum                    | _Hard — deque technique_        |
| ❓ Q2      | LC 346 — Moving Average from Data Stream (concept) | _Easy — queue_                  |

---

### Day 34 — Tue, Mar 24 🟡

| Block      | Topic                                         | Details                    |
| ---------- | --------------------------------------------- | -------------------------- |
| 📦 DS      | **Comparable & Comparator**                   | Custom sorting in Java     |
| ⚙️ ALGO    | **Sort by Custom Criteria**                   | Lambda comparators         |
| 🔗 COMBO   | Sort by frequency using HashMap + custom sort | Combine map + sort         |
| 🧩 PATTERN | **Custom Sort Pattern**                       | Define your own ordering   |
| ❓ Q1      | LC 347 — Top K Frequent Elements              | _Medium — map + sort/heap_ |
| ❓ Q2      | LC 451 — Sort Characters By Frequency         | _Medium — freq + sort_     |

---

### Day 35 — Wed, Mar 25 🟡 (REVIEW DAY)

| Block | Topic                                            |
| ----- | ------------------------------------------------ |
| 🔁    | Sliding Window — write the template from memory  |
| 🔁    | HashMap patterns — frequency, grouping, lookup   |
| 🔁    | Redo 3 problems without looking at solutions     |
| ❓ Q1 | LC 209 — Minimum Size Subarray Sum               |
| ❓ Q2 | LC 424 — Longest Repeating Character Replacement |

**Mentor Note:** Halfway point! By now you should be comfortable with: All basic DS, 5 sorting algorithms, Binary Search, LinkedList, Stack, Queue, HashMap, Sliding Window, Two Pointers. Take a moment to appreciate how far you've come.

---

## 📆 WEEK 6: Mar 26 - Apr 1 — Trees (Binary Tree + BST)

### Day 36 — Thu, Mar 26 🟠

| Block      | Topic                                             | Details                        |
| ---------- | ------------------------------------------------- | ------------------------------ |
| 📦 DS      | **Binary Tree — Node, Left, Right**               | Tree structure basics          |
| ⚙️ ALGO    | **Tree Traversal — Inorder, Preorder, Postorder** | DFS on trees, all 3 orders     |
| 🔗 COMBO   | Build a tree and perform all 3 traversals         | Construction + traversal       |
| 🧩 PATTERN | **DFS on Tree Pattern**                           | Go deep before going wide      |
| ❓ Q1      | LC 94 — Binary Tree Inorder Traversal             | _Easy — recursive_             |
| ❓ Q2      | LC 144 — Binary Tree Preorder Traversal           | _Easy — recursive + iterative_ |

📘 Read: [03_Algorithms/05_Trees.md](../03_Algorithms/05_Trees.md) — Part 1 (Trees)

**Mentor Note:** Trees are recursion in action. If recursion felt hard in Week 3, it'll click now. Every tree problem = "process root, recurse left, recurse right."

---

### Day 37 — Fri, Mar 27 🟠

| Block      | Topic                                      | Details                           |
| ---------- | ------------------------------------------ | --------------------------------- |
| 📦 DS      | **Binary Tree — Levels and Height**        | Level = depth from root           |
| ⚙️ ALGO    | **Level Order Traversal (BFS)**            | Queue-based, level by level       |
| 🔗 COMBO   | Zigzag level order traversal               | BFS with direction flag           |
| 🧩 PATTERN | **BFS on Tree Pattern**                    | Use queue, process level by level |
| ❓ Q1      | LC 102 — Binary Tree Level Order Traversal | _Medium — BFS_                    |
| ❓ Q2      | LC 104 — Maximum Depth of Binary Tree      | _Easy — recursion or BFS_         |

---

### Day 38 — Sat, Mar 28 🟠 (Deep Dive Day)

| Block      | Topic                                               | Details                           |
| ---------- | --------------------------------------------------- | --------------------------------- |
| 📦 DS      | **Binary Tree — Properties**                        | Height, diameter, balanced check  |
| ⚙️ ALGO    | **Recursion on Trees**                              | Return values up the tree         |
| 🔗 COMBO   | Check if balanced + find diameter in same traversal | Optimize with combined recursion  |
| 🧩 PATTERN | **Post-Order Processing Pattern**                   | Process children first, then root |
| ❓ Q1      | LC 543 — Diameter of Binary Tree                    | _Easy — post-order trick_         |
| ❓ Q2      | LC 110 — Balanced Binary Tree                       | _Easy — height-based check_       |

---

### Day 39 — Sun, Mar 29 🟠 (Deep Dive Day)

| Block      | Topic                                | Details                           |
| ---------- | ------------------------------------ | --------------------------------- |
| 📦 DS      | **Binary Search Tree — Concept**     | Left < Root < Right property      |
| ⚙️ ALGO    | **BST Insert, Search, Delete**       | Maintain BST property             |
| 🔗 COMBO   | Build BST from sorted array          | Balanced BST construction         |
| 🧩 PATTERN | **BST Property Pattern**             | Use ordering for efficient search |
| ❓ Q1      | LC 700 — Search in a BST             | _Easy — recursive search_         |
| ❓ Q2      | LC 108 — Convert Sorted Array to BST | _Easy — divide array_             |

---

### Day 40 — Mon, Mar 30 🟠

| Block      | Topic                                  | Details                               |
| ---------- | -------------------------------------- | ------------------------------------- |
| 📦 DS      | **BST — Validation, LCA**              | Is this tree a valid BST?             |
| ⚙️ ALGO    | **Inorder Successor/Predecessor**      | Next/previous in BST                  |
| 🔗 COMBO   | Validate BST using inorder property    | Inorder = sorted → verify             |
| 🧩 PATTERN | **Inorder Sorted Pattern**             | BST inorder always gives sorted order |
| ❓ Q1      | LC 98 — Validate Binary Search Tree    | _Medium — range checking_             |
| ❓ Q2      | LC 235 — Lowest Common Ancestor of BST | _Medium — use BST property_           |

---

### Day 41 — Tue, Mar 31 🟠

| Block      | Topic                            | Details                           |
| ---------- | -------------------------------- | --------------------------------- |
| 📦 DS      | **Tree — Path Problems**         | Root-to-leaf, any-to-any paths    |
| ⚙️ ALGO    | **DFS Path Tracking**            | Carry path info through recursion |
| 🔗 COMBO   | Path sum + all paths enumeration | DFS with backtracking             |
| 🧩 PATTERN | **Root-to-Leaf Pattern**         | Track path from root to leaf      |
| ❓ Q1      | LC 112 — Path Sum                | _Easy — DFS with target_          |
| ❓ Q2      | LC 257 — Binary Tree Paths       | _Easy — string building_          |

---

### Day 42 — Wed, Apr 1 🟠 (REVIEW DAY)

| Block | Topic                                                           |
| ----- | --------------------------------------------------------------- |
| 🔁    | Tree traversal — all 4 types (in, pre, post, level) from memory |
| 🔁    | BST operations — insert, search, delete, validate               |
| 🔁    | Draw tree problems on paper before coding                       |
| ❓ Q1 | LC 226 — Invert Binary Tree                                     |
| ❓ Q2 | LC 101 — Symmetric Tree                                         |

**Mentor Note:** If trees feel hard, that's normal. Re-do Day 36-39 problems. Trees become intuitive after ~20 problems. You're building that 20-problem foundation right now.

---

# PHASE 3: ADVANCED TOPICS (Week 7-10)

_"You've mastered the tools. Now you learn to combine them, optimize them, and solve problems you've never seen before."_

---

## 📆 WEEK 7: Apr 2-8 — Heaps + Graphs Introduction

### Day 43 — Thu, Apr 2 🟠

| Block      | Topic                                    | Details                         |
| ---------- | ---------------------------------------- | ------------------------------- |
| 📦 DS      | **Min-Heap / Max-Heap**                  | Implementation, heapify         |
| ⚙️ ALGO    | **Heap Sort**                            | Build heap → extract min/max    |
| 🔗 COMBO   | Find Kth largest element using heap      | Maintain heap of size K         |
| 🧩 PATTERN | **Top-K Pattern**                        | Heap of size K for top/bottom K |
| ❓ Q1      | LC 215 — Kth Largest Element in an Array | _Medium — heap or quickselect_  |
| ❓ Q2      | LC 703 — Kth Largest Element in a Stream | _Easy — min-heap of size K_     |

📘 Read: [02_Data_Structures/02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md) — Heap section  
📘 Read: [03_Algorithms/07a_Advanced_DS_Core.md](../03_Algorithms/07a_Advanced_DS_Core.md) — Heap section

---

### Day 44 — Fri, Apr 3 🟠

| Block      | Topic                               | Details                       |
| ---------- | ----------------------------------- | ----------------------------- |
| 📦 DS      | **PriorityQueue in Java**           | Built-in min/max heap         |
| ⚙️ ALGO    | **Merge K Sorted Structures**       | K-way merge using heap        |
| 🔗 COMBO   | Merge K sorted lists                | Heap + linked list pointers   |
| 🧩 PATTERN | **K-Way Merge Pattern**             | Multiple sources → one output |
| ❓ Q1      | LC 23 — Merge k Sorted Lists        | _Hard — heap classic_         |
| ❓ Q2      | LC 973 — K Closest Points to Origin | _Medium — max-heap_           |

---

### Day 45 — Sat, Apr 4 🟠 (Deep Dive Day)

| Block      | Topic                               | Details                       |
| ---------- | ----------------------------------- | ----------------------------- |
| 📦 DS      | **Graph — Adjacency List & Matrix** | How to represent graphs       |
| ⚙️ ALGO    | **BFS on Graph**                    | Level-by-level exploration    |
| 🔗 COMBO   | Shortest path in unweighted graph   | BFS = shortest for unweighted |
| 🧩 PATTERN | **Graph BFS Pattern**               | Queue + visited set           |
| ❓ Q1      | LC 200 — Number of Islands          | _Medium — BFS/DFS on grid_    |
| ❓ Q2      | LC 733 — Flood Fill                 | _Easy — BFS/DFS_              |

📘 Read: [03_Algorithms/05_Trees.md](../03_Algorithms/05_Trees.md) — Graphs section

**Mentor Note:** Graphs are just "trees with cycles." BFS on graphs = BFS on trees + visited set. You already know the foundation from Week 6.

---

### Day 46 — Sun, Apr 5 🟠 (Deep Dive Day)

| Block      | Topic                                      | Details                     |
| ---------- | ------------------------------------------ | --------------------------- |
| 📦 DS      | **Graph — Directed, Undirected, Weighted** | Graph types                 |
| ⚙️ ALGO    | **DFS on Graph**                           | Go deep, backtrack, explore |
| 🔗 COMBO   | Find all connected components using DFS    | Count disconnected pieces   |
| 🧩 PATTERN | **Graph DFS Pattern**                      | Recursion + visited         |
| ❓ Q1      | LC 547 — Number of Provinces               | _Medium — DFS/Union Find_   |
| ❓ Q2      | LC 695 — Max Area of Island                | _Medium — DFS on grid_      |

---

### Day 47 — Mon, Apr 6 🟠

| Block      | Topic                                         | Details                              |
| ---------- | --------------------------------------------- | ------------------------------------ |
| 📦 DS      | **Graph — Cycle Detection**                   | Detect cycles in directed/undirected |
| ⚙️ ALGO    | **Topological Sort (Kahn's BFS)**             | Process nodes in dependency order    |
| 🔗 COMBO   | Course Schedule — can you finish all courses? | Cycle detection + topo sort          |
| 🧩 PATTERN | **Topological Sort Pattern**                  | Dependency resolution                |
| ❓ Q1      | LC 207 — Course Schedule                      | _Medium — cycle in directed graph_   |
| ❓ Q2      | LC 210 — Course Schedule II                   | _Medium — topo sort order_           |

---

### Day 48 — Tue, Apr 7 🟠

| Block      | Topic                              | Details                                   |
| ---------- | ---------------------------------- | ----------------------------------------- |
| 📦 DS      | **Weighted Graph**                 | Edge weights, shortest path concept       |
| ⚙️ ALGO    | **Dijkstra's Algorithm (concept)** | Greedy shortest path                      |
| 🔗 COMBO   | Network delay time                 | Shortest path in weighted graph           |
| 🧩 PATTERN | **Shortest Path Pattern**          | BFS for unweighted, Dijkstra for weighted |
| ❓ Q1      | LC 743 — Network Delay Time        | _Medium — Dijkstra_                       |
| ❓ Q2      | LC 994 — Rotting Oranges           | _Medium — multi-source BFS_               |

---

### Day 49 — Wed, Apr 8 🟠 (REVIEW DAY)

| Block | Topic                                           |
| ----- | ----------------------------------------------- |
| 🔁    | Heap — implement from scratch, solve 2 problems |
| 🔁    | Graph — BFS and DFS templates from memory       |
| 🔁    | Draw graphs and trace algorithms on paper       |
| ❓ Q1 | LC 133 — Clone Graph                            |
| ❓ Q2 | Graph problem of your choice                    |

---

> >

## 📆 WEEK 8: Apr 9-15 — Dynamic Programming Foundations

### Day 50 — Thu, Apr 9 🟠

| Block      | Topic                                    | Details                           |
| ---------- | ---------------------------------------- | --------------------------------- |
| 📦 DS      | **DP Table — 1D Array for Memoization**  | Store computed results            |
| ⚙️ ALGO    | **Fibonacci — Memoization + Tabulation** | Top-down vs Bottom-up             |
| 🔗 COMBO   | Climbing Stairs = Fibonacci in disguise  | See the DP structure              |
| 🧩 PATTERN | **1D DP Pattern**                        | dp[i] depends on dp[i-1], dp[i-2] |
| ❓ Q1      | LC 70 — Climbing Stairs                  | _Easy — 1D DP_                    |
| ❓ Q2      | LC 509 — Fibonacci (DP approach)         | _Easy — tabulation_               |

📘 Read: [03_Algorithms/04b_DP_Fundamentals.md](../03_Algorithms/04b_DP_Fundamentals.md) — Basics section

**Mentor Note:** DP is the most feared topic. But it's just: "Can I break this into smaller problems? Can I store results to avoid re-solving?" That's it. Start simple, build confidence.

---

### Day 51 — Fri, Apr 10 🟠

| Block      | Topic                             | Details                            |
| ---------- | --------------------------------- | ---------------------------------- |
| 📦 DS      | **DP Table — Space Optimization** | Use 2 variables instead of array   |
| ⚙️ ALGO    | **House Robber Logic**            | Include or exclude current element |
| 🔗 COMBO   | Max sum of non-adjacent elements  | Classic include/exclude            |
| 🧩 PATTERN | **Include/Exclude DP Pattern**    | Take it or skip it                 |
| ❓ Q1      | LC 198 — House Robber             | _Medium — 1D DP_                   |
| ❓ Q2      | LC 746 — Min Cost Climbing Stairs | _Easy — 1D DP_                     |

---

### Day 52 — Sat, Apr 11 🔴 (Deep Dive Day)

| Block      | Topic                               | Details                                        |
| ---------- | ----------------------------------- | ---------------------------------------------- |
| 📦 DS      | **DP Table — 2D Array**             | Two dimensions of state                        |
| ⚙️ ALGO    | **0/1 Knapsack**                    | Classic DP: take or leave                      |
| 🔗 COMBO   | Subset Sum = Knapsack variant       | Can you make this sum?                         |
| 🧩 PATTERN | **2D DP Pattern (Knapsack Family)** | dp[i][j] = considering i items with capacity j |
| ❓ Q1      | LC 416 — Partition Equal Subset Sum | _Medium — subset sum_                          |
| ❓ Q2      | LC 494 — Target Sum (approach)      | _Medium — knapsack variant_                    |

📘 Read: [03_Algorithms/04b_DP_Fundamentals.md](../03_Algorithms/04b_DP_Fundamentals.md) — Knapsack section

---

### Day 53 — Sun, Apr 12 🔴 (Deep Dive Day)

| Block      | Topic                                | Details                                      |
| ---------- | ------------------------------------ | -------------------------------------------- |
| 📦 DS      | **String DP Table**                  | 2D table for two strings                     |
| ⚙️ ALGO    | **Longest Common Subsequence (LCS)** | Compare two strings character by character   |
| 🔗 COMBO   | Edit Distance = LCS extended         | Insert, delete, replace operations           |
| 🧩 PATTERN | **Two-String DP Pattern**            | dp[i][j] for string1[0..i] and string2[0..j] |
| ❓ Q1      | LC 1143 — Longest Common Subsequence | _Medium — 2D DP_                             |
| ❓ Q2      | LC 72 — Edit Distance                | _Medium — classic DP_                        |

---

### Day 54 — Mon, Apr 13 🔴

| Block      | Topic                                              | Details                       |
| ---------- | -------------------------------------------------- | ----------------------------- |
| 📦 DS      | **1D DP with Binary Search**                       | LIS optimization              |
| ⚙️ ALGO    | **Longest Increasing Subsequence**                 | O(n²) DP → O(n log n) with BS |
| 🔗 COMBO   | LIS variants — print the sequence                  | Track parent pointers         |
| 🧩 PATTERN | **LIS Pattern**                                    | Patience sorting / DP + BS    |
| ❓ Q1      | LC 300 — Longest Increasing Subsequence            | _Medium — DP_                 |
| ❓ Q2      | LC 674 — Longest Continuous Increasing Subsequence | _Easy — sliding window_       |

---

### Day 55 — Tue, Apr 14 🔴

| Block      | Topic                                                     | Details                               |
| ---------- | --------------------------------------------------------- | ------------------------------------- |
| 📦 DS      | **DP with Multiple States**                               | Track multiple variables              |
| ⚙️ ALGO    | **Buy and Sell Stock Variants**                           | State: holding, not holding, cooldown |
| 🔗 COMBO   | Stock with cooldown or transaction limit                  | State machine DP                      |
| 🧩 PATTERN | **State Machine DP Pattern**                              | Transition between states             |
| ❓ Q1      | LC 121 — Best Time to Buy and Sell Stock (review DP lens) | _Easy — see it as DP_                 |
| ❓ Q2      | LC 122 — Best Time to Buy and Sell Stock II               | _Medium — greedy or DP_               |

---

### Day 56 — Wed, Apr 15 🔴 (REVIEW DAY)

| Block | Topic                                                       |
| ----- | ----------------------------------------------------------- |
| 🔁    | DP pattern identification — given a problem, which DP type? |
| 🔁    | Bottom-up vs Top-down — practice converting between them    |
| 🔁    | Redo LC 70, 198, 416, 1143 from memory                      |
| ❓ Q1 | LC 62 — Unique Paths                                        |
| ❓ Q2 | LC 64 — Minimum Path Sum                                    |

**Mentor Note:** DP mastery comes from pattern recognition. After this week, you should recognize: "This is a knapsack problem" or "This is an LCS problem." If you can't, review the patterns.

---

## 📆 WEEK 9: Apr 16-22 — Greedy + Backtracking

### Day 57 — Thu, Apr 16 🔴

| Block      | Topic                                        | Details                             |
| ---------- | -------------------------------------------- | ----------------------------------- |
| 📦 DS      | **Interval Arrays**                          | Represent intervals as [start, end] |
| ⚙️ ALGO    | **Activity Selection / Interval Scheduling** | Greedy by end time                  |
| 🔗 COMBO   | Non-overlapping intervals                    | Greedy: remove minimum intervals    |
| 🧩 PATTERN | **Greedy Interval Pattern**                  | Sort by end → pick greedily         |
| ❓ Q1      | LC 435 — Non-overlapping Intervals           | _Medium — greedy_                   |
| ❓ Q2      | LC 452 — Minimum Number of Arrows            | _Medium — intervals_                |

📘 Read: [03_Algorithms/12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md)  
📘 Read: [03_Algorithms/06a_Greedy_BitManip.md](../03_Algorithms/06a_Greedy_BitManip.md) — Greedy section

---

### Day 58 — Fri, Apr 17 🔴

| Block      | Topic                               | Details                  |
| ---------- | ----------------------------------- | ------------------------ |
| 📦 DS      | **Boolean/State Arrays for Greedy** | Track reachability       |
| ⚙️ ALGO    | **Jump Game Logic**                 | Can you reach the end?   |
| 🔗 COMBO   | Maximum jumps to reach end          | Greedy forward scanning  |
| 🧩 PATTERN | **Greedy Forward Scan Pattern**     | Track furthest reachable |
| ❓ Q1      | LC 55 — Jump Game                   | _Medium — greedy_        |
| ❓ Q2      | LC 45 — Jump Game II                | _Medium — greedy BFS_    |

---

### Day 59 — Sat, Apr 18 🔴 (Deep Dive Day)

| Block      | Topic                                     | Details                                 |
| ---------- | ----------------------------------------- | --------------------------------------- |
| 📦 DS      | **Recursion Tree for Backtracking**       | Visualize all choices                   |
| ⚙️ ALGO    | **Backtracking — Permutations**           | Choose → Explore → Unchoose             |
| 🔗 COMBO   | Generate all permutations of array        | Classic backtracking                    |
| 🧩 PATTERN | **Backtracking Template**                 | The 3-step pattern for all backtracking |
| ❓ Q1      | LC 46 — Permutations                      | _Medium — backtracking_                 |
| ❓ Q2      | LC 47 — Permutations II (with duplicates) | _Medium — skip duplicates_              |

📘 Read: [03_Algorithms/11_Backtracking_Complete.md](../03_Algorithms/11_Backtracking_Complete.md)  
📘 Read: [03_Algorithms/03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md) — Backtracking section

**Mentor Note:** Backtracking = recursion + undo. Draw the recursion tree for every problem. If you can draw the tree, you can write the code.

---

### Day 60 — Sun, Apr 19 🔴 (Deep Dive Day)

| Block      | Topic                                            | Details                             |
| ---------- | ------------------------------------------------ | ----------------------------------- |
| 📦 DS      | **Subset Generation Tree**                       | Binary choice: include or exclude   |
| ⚙️ ALGO    | **Subsets & Combinations**                       | Generate all subsets, C(n,r)        |
| 🔗 COMBO   | Combination Sum — find combos that sum to target | Backtracking with pruning           |
| 🧩 PATTERN | **Subset Generation Pattern**                    | Include/exclude at each step        |
| ❓ Q1      | LC 78 — Subsets                                  | _Medium — backtracking_             |
| ❓ Q2      | LC 39 — Combination Sum                          | _Medium — backtracking with repeat_ |

---

### Day 61 — Mon, Apr 20 🔴

| Block      | Topic                                       | Details                             |
| ---------- | ------------------------------------------- | ----------------------------------- |
| 📦 DS      | **2D Board for Grid Backtracking**          | Navigate grid with choices          |
| ⚙️ ALGO    | **N-Queens / Word Search**                  | Place queens, search words          |
| 🔗 COMBO   | Word Search on 2D board                     | Grid + backtracking + visited       |
| 🧩 PATTERN | **Grid Backtracking Pattern**               | 4-directional exploration with undo |
| ❓ Q1      | LC 79 — Word Search                         | _Medium — grid backtracking_        |
| ❓ Q2      | LC 51 — N-Queens (conceptual understanding) | _Hard — know the approach_          |

---

### Day 62 — Tue, Apr 21 🟠

| Block      | Topic                               | Details                        |
| ---------- | ----------------------------------- | ------------------------------ |
| 📦 DS      | **Trie — Concept & Implementation** | Prefix tree for strings        |
| ⚙️ ALGO    | **String Matching with Trie**       | Insert + search + prefix check |
| 🔗 COMBO   | Implement Trie and search words     | Build from scratch             |
| 🧩 PATTERN | **Trie Pattern**                    | Common prefix → tree structure |
| ❓ Q1      | LC 208 — Implement Trie             | _Medium — design_              |
| ❓ Q2      | LC 14 — Longest Common Prefix       | _Easy — trie or vertical scan_ |

📘 Read: [03_Algorithms/07a_Advanced_DS_Core.md](../03_Algorithms/07a_Advanced_DS_Core.md) — Trie section

---

### Day 63 — Wed, Apr 22 🔴 (REVIEW DAY)

| Block | Topic                                                       |
| ----- | ----------------------------------------------------------- |
| 🔁    | Greedy vs DP — when does greedy work? When must you use DP? |
| 🔁    | Backtracking template — write from memory                   |
| 🔁    | Solve 3 backtracking problems timed (15 min each)           |
| ❓ Q1 | LC 22 — Generate Parentheses                                |
| ❓ Q2 | LC 17 — Letter Combinations of a Phone Number               |

---

## 📆 WEEK 10: Apr 23-29 — Advanced Patterns + Remaining Topics

### Day 64 — Thu, Apr 23 🔴

| Block      | Topic                          | Details                       |
| ---------- | ------------------------------ | ----------------------------- |
| 📦 DS      | **DP Table for Coin Change**   | Unbounded knapsack variant    |
| ⚙️ ALGO    | **Coin Change Variants**       | Minimum coins, number of ways |
| 🔗 COMBO   | Fewest coins to make amount    | Bottom-up DP                  |
| 🧩 PATTERN | **Unbounded Knapsack Pattern** | Items can be reused           |
| ❓ Q1      | LC 322 — Coin Change           | _Medium — DP_                 |
| ❓ Q2      | LC 518 — Coin Change 2         | _Medium — count ways_         |

---

### Day 65 — Fri, Apr 24 🔴

| Block      | Topic                                        | Details                              |
| ---------- | -------------------------------------------- | ------------------------------------ |
| 📦 DS      | **Matrix for Grid DP**                       | dp[i][j] for grid problems           |
| ⚙️ ALGO    | **Grid DP — Unique Paths, Min Path**         | Move right/down in grid              |
| 🔗 COMBO   | Minimum falling path sum                     | Grid + DP                            |
| 🧩 PATTERN | **Grid DP Pattern**                          | dp[i][j] = f(dp[i-1][j], dp[i][j-1]) |
| ❓ Q1      | LC 62 — Unique Paths (if not already solved) | _Medium — grid DP_                   |
| ❓ Q2      | LC 931 — Minimum Falling Path Sum            | _Medium — grid DP_                   |

---

### Day 66 — Sat, Apr 25 🟠 (Deep Dive Day)

| Block      | Topic                        | Details                               |
| ---------- | ---------------------------- | ------------------------------------- |
| 📦 DS      | **Bit Representation**       | Binary, AND, OR, XOR, shifts          |
| ⚙️ ALGO    | **Bit Manipulation Tricks**  | Single number, power of 2, count bits |
| 🔗 COMBO   | Count set bits + XOR tricks  | Combine bitwise operations            |
| 🧩 PATTERN | **Bit Manipulation Pattern** | XOR for duplicates, AND for masking   |
| ❓ Q1      | LC 136 — Single Number       | _Easy — XOR_                          |
| ❓ Q2      | LC 191 — Number of 1 Bits    | _Easy — bit counting_                 |

📘 Read: [03_Algorithms/10_Bit_Manipulation_Complete.md](../03_Algorithms/10_Bit_Manipulation_Complete.md)

---

### Day 67 — Sun, Apr 26 🔴 (Deep Dive Day)

| Block      | Topic                                              | Details                             |
| ---------- | -------------------------------------------------- | ----------------------------------- |
| 📦 DS      | **Union-Find / Disjoint Set**                      | Find, Union, Rank, Path Compression |
| ⚙️ ALGO    | **Union by Rank + Path Compression**               | Efficient connected components      |
| 🔗 COMBO   | Connected components using Union-Find              | Alternative to DFS                  |
| 🧩 PATTERN | **Union-Find Pattern**                             | Group elements, check connectivity  |
| ❓ Q1      | LC 684 — Redundant Connection                      | _Medium — union find_               |
| ❓ Q2      | LC 547 — Number of Provinces (Union Find approach) | _Medium — redo with UF_             |

📘 Read: [03_Algorithms/14_Union_Find_DSU_Complete.md](../03_Algorithms/14_Union_Find_DSU_Complete.md)

---

### Day 68 — Mon, Apr 27 🟠

| Block      | Topic                                  | Details                                 |
| ---------- | -------------------------------------- | --------------------------------------- |
| 📦 DS      | **String — Advanced Operations**       | KMP concept, pattern matching           |
| ⚙️ ALGO    | **String Algorithms Overview**         | Rabin-Karp concept, Z-algorithm concept |
| 🔗 COMBO   | Pattern searching in text              | Use built-in or manual matching         |
| 🧩 PATTERN | **String Matching Pattern**            | Sliding window on strings               |
| ❓ Q1      | LC 28 — Find Index of First Occurrence | _Easy — string search_                  |
| ❓ Q2      | LC 459 — Repeated Substring Pattern    | _Easy — string analysis_                |

📘 Read: [03_Algorithms/13_String_Algorithms_Complete.md](../03_Algorithms/13_String_Algorithms_Complete.md)

---

### Day 69 — Tue, Apr 28 🔴

| Block      | Topic                                  | Details                              |
| ---------- | -------------------------------------- | ------------------------------------ |
| 📦 DS      | **Monotonic Stack — Deep Dive**        | Maintain decreasing/increasing order |
| ⚙️ ALGO    | **Next Greater/Smaller Variants**      | Left, right, circular                |
| 🔗 COMBO   | Largest Rectangle in Histogram         | Stack-based area calculation         |
| 🧩 PATTERN | **Monotonic Stack Advanced Pattern**   | Process in order, maintain invariant |
| ❓ Q1      | LC 84 — Largest Rectangle in Histogram | _Hard — monotonic stack_             |
| ❓ Q2      | LC 42 — Trapping Rain Water            | _Hard — two pointer or stack_        |

📘 Read: [03_Algorithms/15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)

**Mentor Note:** LC 84 and LC 42 are classics that appear in interviews at top companies. Even understanding the approach is a win. Don't stress if the implementation takes time.

---

### Day 70 — Wed, Apr 29 🔴 (REVIEW DAY)

| Block | Topic                                            |
| ----- | ------------------------------------------------ |
| 🔁    | All advanced patterns — review templates         |
| 🔁    | Mixed problem solving — random pick, solve timed |
| 🔁    | Identify your 3 weakest topics                   |
| ❓ Q1 | LC 11 — Container With Most Water                |
| ❓ Q2 | LC 15 — 3Sum                                     |

**Mentor Note:** End of Phase 3. You now have exposure to EVERY major topic. The goal was never perfection — it's recognition. When you see a problem, you should now think "Oh, this looks like a sliding window problem" or "This needs DP." That recognition is your superpower.

---

# PHASE 4: INTEGRATION + POLISH (Week 11)

_"The final stretch. Tie everything together. Test yourself. Build confidence."_

---

## 📆 WEEK 11: Apr 30 - May 5 — SQL + System Design + Mock Interviews

### Day 71 — Thu, Apr 30 🟣

| Block      | Topic                                             | Details                      |
| ---------- | ------------------------------------------------- | ---------------------------- |
| 📦 DS      | **System Design Basics**                          | Components, trade-offs       |
| ⚙️ ALGO    | **OOP Principles Review (SOLID)**                 | S, O, L, I, D with examples  |
| 🔗 COMBO   | Design a simple class hierarchy                   | Apply OOP to a real scenario |
| 🧩 PATTERN | **Design Patterns** (Singleton, Factory)          | Creator patterns             |
| ❓ Q1      | Mixed Medium problem (pick random from weak area) |
| ❓ Q2      | SQL — Basic SELECT, WHERE, ORDER BY               |

📘 Read: [06_OOP_Design/01_OOPS_Principles.md](../06_OOP_Design/01_OOPS_Principles.md)  
📘 Read: [06_OOP_Design/02_Design_Patterns.md](../06_OOP_Design/02_Design_Patterns.md)  
📘 Read: [08_SQL/01_Foundations_Database_Basics.md](../08_SQL/01_Foundations_Database_Basics.md)

---

### Day 72 — Fri, May 1 🟣

| Block      | Topic                                    | Details                                 |
| ---------- | ---------------------------------------- | --------------------------------------- |
| 📦 DS      | **SQL Tables & Relations**               | Primary key, foreign key, normalization |
| ⚙️ ALGO    | **SQL JOINs**                            | INNER, LEFT, RIGHT, FULL OUTER          |
| 🔗 COMBO   | Multi-table queries                      | Join 2-3 tables to answer questions     |
| 🧩 PATTERN | **SQL Aggregation Pattern**              | GROUP BY + HAVING + aggregate functions |
| ❓ Q1      | SQL — Employee earning more than manager | _Classic SQL_                           |
| ❓ Q2      | SQL — Find duplicate emails              | _Classic SQL_                           |

📘 Read: [08_SQL/24_SQL_Data_Analyst_RealWorld.md](../08_SQL/24_SQL_Data_Analyst_RealWorld.md)  
📘 Read: [08_SQL/01_Foundations_Database_Basics.md](../08_SQL/01_Foundations_Database_Basics.md)

---

### Day 73 — Sat, May 2 🟣 (MOCK INTERVIEW DAY 1)

```
FULL MOCK INTERVIEW — 3 Hours

Hour 1: DSA Problems
  Problem 1 (Easy) — 20 min — pick from your solved list
  Problem 2 (Medium) — 30 min — random pick, explain approach first
  After: Review where you got stuck

Hour 2: System Design Discussion
  Design a URL Shortener (or Rate Limiter) — 30 min
  Think about: API, Database, Scale

Hour 3: Review + Weak Areas
  Redo 2 problems from your weakest topic
  Note: What pattern did I miss? Why?
```

📘 Read: [06_OOP_Design/03_System_Design.md](../06_OOP_Design/03_System_Design.md)

---

### Day 74 — Sun, May 3 🟣 (MOCK INTERVIEW DAY 2)

```
FULL MOCK INTERVIEW — 3 Hours

Hour 1: DSA Problems
  Problem 1 (Medium) — 25 min
  Problem 2 (Medium) — 25 min
  Practice talking through your approach

Hour 2: SQL Problem Set
  3 SQL problems (JOIN, GROUP BY, Subquery)

Hour 3: Final Weak Area Push
  Your weakest 2 topics — 3 problems each
  Write a 1-line summary for each pattern
```

📘 Read: [08_SQL/17_Practice_100_Problems.md](../08_SQL/17_Practice_100_Problems.md)

---

### Day 75 — Mon, May 4 🟣 (FLASH REVISION)

```
QUICK REFERENCE REVISION — Review Everything

Morning (2 hrs):
  Review all DS complexities — O(1), O(n), O(log n) for each DS
  All algorithm patterns — one-line summary each
  Key formulas: GCD, LCM, nCr, sorting bounds

Afternoon (2 hrs):
  All coding patterns — when to use each
  Redo your 5 favorite problems (the ones you feel proud of)

Evening (1 hr):
  Top 10 mistakes to avoid in interviews
  Edge cases checklist review
```

📘 Read: [09_Career_Reference/11_Quick_Reference.md](../09_Career_Reference/11_Quick_Reference.md)  
📘 Read: [04_Patterns_Templates/02_Code_Templates.md](../04_Patterns_Templates/02_Code_Templates.md)  
📘 Read: [05_Problem_Solving/23_Edge_Cases.md](../05_Problem_Solving/23_Edge_Cases.md)  
📘 Read: [05_Problem_Solving/24_Common_Mistakes.md](../05_Problem_Solving/24_Common_Mistakes.md)

---

### Day 76 — Tue, May 5 🟣 (FINAL DAY — CONFIDENCE BUILDER)

```
LIGHT DAY — Trust Your Preparation

Morning:
  Redo 5 favorite solved problems — enjoy the speed
  Review your handwritten notes
  Scan Quick Reference one more time

Afternoon:
  Mental rehearsal: visualize yourself in the interview
  Positive self-talk: "I've prepared for 76 days. I'm ready."

Evening:
  REST. Sleep well. No new problems.
  Tomorrow you perform. Today you prepare your mind.
```

📘 Read: [09_Career_Reference/12_Brain_Psychology.md](../09_Career_Reference/12_Brain_Psychology.md)

**Final Mentor Note:** You've covered Arrays, Strings, Matrices, LinkedLists, Stacks, Queues, HashMaps, Trees, Graphs, Heaps, DP, Greedy, Backtracking, Tries, Union-Find, Bit Manipulation, Monotonic Stacks, SQL, System Design, and OOP. You solved 150+ problems. You learned 20+ patterns. You are ready. Trust the process.

---

# 📊 PROGRESS TRACKER

## Weekly Checklist

| Week | Dates        | Topics                                             | Confidence (1-5) | Problems Solved |
| ---- | ------------ | -------------------------------------------------- | ---------------- | --------------- |
| 1    | Feb 19-25    | Arrays, Sorting Basics, Patterns                   | \_\_ / 5         | \_\_ / 14       |
| 2    | Feb 26-Mar 4 | Strings, Sorting Deep, Two Pointers, Binary Search | \_\_ / 5         | \_\_ / 14       |
| 3    | Mar 5-11     | Linked List, Recursion, GCD/Primes                 | \_\_ / 5         | \_\_ / 14       |
| 4    | Mar 12-18    | Stack, Queue, HashMap, Kadane's                    | \_\_ / 5         | \_\_ / 14       |
| 5    | Mar 19-25    | Sliding Window, Hashing Deep, Intervals            | \_\_ / 5         | \_\_ / 14       |
| 6    | Mar 26-Apr 1 | Binary Tree, BST, Tree Patterns                    | \_\_ / 5         | \_\_ / 14       |
| 7    | Apr 2-8      | Heaps, Graphs, BFS/DFS, Topo Sort                  | \_\_ / 5         | \_\_ / 14       |
| 8    | Apr 9-15     | Dynamic Programming (1D, 2D, Knapsack, LCS, LIS)   | \_\_ / 5         | \_\_ / 14       |
| 9    | Apr 16-22    | Greedy, Backtracking, Trie                         | \_\_ / 5         | \_\_ / 14       |
| 10   | Apr 23-29    | Coin Change DP, Bits, Union-Find, Monotonic Stack  | \_\_ / 5         | \_\_ / 14       |
| 11   | Apr 30-May 5 | SQL, System Design, OOP, Mock Interviews           | \_\_ / 5         | \_\_ / 12       |

**TARGET: 150+ problems solved, 20+ patterns mastered**

---

## Daily Log Template

```
Date: ___________  Day __ / 76

DS Topic:    _________________ [Done? Y/N]
Algo Topic:  _________________ [Done? Y/N]
Combo:       _________________ [Done? Y/N]
Pattern:     _________________ [Done? Y/N]
Q1:          _________________ [Solved? Y/N] [Time: __ min]
Q2:          _________________ [Solved? Y/N] [Time: __ min]

What I struggled with: _______________________
What clicked today:    _______________________
Tomorrow's focus:      _______________________
```

---

## Complete File Reference by Week

| Week | Primary Reading Files                                                                                                                                                                                                                                                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [01a_Memory_Foundations.md](../02_Data_Structures/01a_Memory_Foundations.md), [01_Algorithm_Thinking.md](../03_Algorithms/01_Algorithm_Thinking.md), [09_Pattern_Programs_Complete.md](../03_Algorithms/09_Pattern_Programs_Complete.md), [02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md)                                      |
| 2    | [02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md), [07_Two_Pointers_Complete.md](../04_Patterns_Templates/07_Two_Pointers_Complete.md), [06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md), [04_2D_Arrays_Matrix.md](../02_Data_Structures/04_2D_Arrays_Matrix.md)                            |
| 3    | [02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md), [03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md), [08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md)                                                                                                                           |
| 4    | [02a_DS_Variants_Core.md](../02_Data_Structures/02a_DS_Variants_Core.md) (Stack/Queue), [08a_NumberTheory_Core.md](../03_Algorithms/08a_NumberTheory_Core.md) (Modular), [15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)                                                                                     |
| 5    | [01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md), [03_Collections_Java.md](../02_Data_Structures/03_Collections_Java.md), [04_Pattern_Recognition.md](../04_Patterns_Templates/04_Pattern_Recognition.md)                                                                                                                             |
| 6    | [05_Trees.md](../03_Algorithms/05_Trees.md) (Trees), [04_Pattern_Recognition.md](../04_Patterns_Templates/04_Pattern_Recognition.md)                                                                                                                                                                                                                       |
| 7    | [05_Trees.md](../03_Algorithms/05_Trees.md) (Graphs), [07a_Advanced_DS_Core.md](../03_Algorithms/07a_Advanced_DS_Core.md) (Heap)                                                                                                                                                                                                                           |
| 8    | [04b_DP_Fundamentals.md](../03_Algorithms/04b_DP_Fundamentals.md)                                                                                                                                                                                                                                                                                          |
| 9    | [12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md), [11_Backtracking_Complete.md](../03_Algorithms/11_Backtracking_Complete.md), [07a_Advanced_DS_Core.md](../03_Algorithms/07a_Advanced_DS_Core.md) (Trie)                                                                                                             |
| 10   | [10_Bit_Manipulation_Complete.md](../03_Algorithms/10_Bit_Manipulation_Complete.md), [14_Union_Find_DSU_Complete.md](../03_Algorithms/14_Union_Find_DSU_Complete.md), [13_String_Algorithms_Complete.md](../03_Algorithms/13_String_Algorithms_Complete.md), [15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md) |
| 11   | [01_OOPS_Principles.md](../06_OOP_Design/01_OOPS_Principles.md), [03_System_Design.md](../06_OOP_Design/03_System_Design.md), [01_Foundations_Database_Basics.md](../08_SQL/01_Foundations_Database_Basics.md), [11_Quick_Reference.md](../09_Career_Reference/11_Quick_Reference.md)                                                                      |

---

## Success Milestones

```
BY END OF WEEK 3 (Mar 11):
  Can solve any Easy array/string problem in < 15 min
  Implement all basic sorts from memory
  Reverse linked list both ways without looking
  Binary search — zero bugs

BY END OF WEEK 6 (Apr 1):
  Solve Easy problems in < 10 min
  Solve Medium problems in < 25 min
  Know sliding window, two pointers, binary search patterns cold
  Tree traversals from memory

BY END OF WEEK 8 (Apr 15):
  Solve 2 Mediums in 1 hour
  Identify DP pattern within 5 minutes
  Graph BFS/DFS template from memory
  100+ problems solved

BY END OF WEEK 11 (May 5):
  Solve 2 Mediums in 50 minutes
  Explain any DS/Algorithm clearly
  Write SQL JOINs and GROUP BYs
  System design discussion confidence
  150+ problems solved
  READY FOR INTERVIEWS
```

---

_Last Updated: February 19, 2026_  
_Plan Duration: 76 Days | 11 Weeks | Feb 19 - May 5, 2026_  
_Structure: DS + Algo + Combo + Pattern + 2 Questions daily_

**Your journey starts TODAY. One day at a time. Let's go.**

---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md)
