# 📝 Data Structures — Problem Sets

## `02_Data_Structures` Module | MIT 6.006 Style

## 5W1H — Why This Chapter?

> **WHAT:** MIT 6.006-style exam-quality problem sets covering every core data structure (array, linked list, stack/queue, hash table, tree, heap), with constraint-first framing, invariant reasoning, edge-case enumeration, and Erklärung (common-mistake) blocks. Each problem is a pen-and-paper proof OR a hand-coded implementation with JUnit verification.
>
> **WHY:** Data structures are not learned by reading — they are learned by *solving problems that test the boundary cases*. A student who can recite "ArrayList is amortized O(1) append" but cannot prove the amortized bound from a geometric series has not yet understood the data structure. Problem sets at MIT 6.006 / ETH / KTH level force this understanding by requiring proofs, edge-case enumeration, and trade-off analysis.
>
> **WHO:** Engineers preparing for university exams (CS algorithms, data structures, competitive programming), Staff/Principal interviews (Bar Raiser, system design coding), and research roles (algorithmic reasoning, paper reading).
>
> **WHEN:** After reading the chapter (`01a` through `01f` for foundations; `02a`/`02b` for variants). Before moving to `03_Algorithms`. Revisit weekly for 3-6 months to consolidate.
>
> **WHERE:** Use as the central assessment loop for the folder. Each problem has an `Erklärung` block — if your answer does not match the Erklärung reasoning, you have a gap. Close the gap by re-reading the relevant chapter.
>
> **HOW:** Three passes per problem:
> 1. **Read constraints** — extract the (n, time, memory) triple.
> 2. **Solve on paper** — pseudocode + complexity + edge cases.
> 3. **Implement + verify** — Java skeleton at the bottom of each set; run JUnit; green = pass. Red = read Erklärung.

> **How to use this file:**
>
> 1. Attempt each problem before reading the answer.
> 2. Implement Part B code in Java (skeleton at the bottom of each set).
> 3. Run the provided JUnit test stub — green = pass.
> 4. If you fail: read the 🔴 **Erklärung** block — it tells you _exactly_ why.

---

## Historical Evolution of Algorithm Problem Sets in CS Education

Algorithm problem sets did not appear fully formed — they evolved through distinct eras, each solving a specific pedagogical or practical need. Understanding this lineage clarifies why MIT 6.006 problem sets look the way they do and how they differ from competitive-programming judges or interview-prep platforms.

### Timeline

| Era              | Milestone                                                                | Significance                                                                                                           |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **1960s**        | Knuth, _The Art of Computer Programming_ (Vol 1, 1968)                   | First systematic algorithm exercises; TAOCP sets introduced rigorous proof-based problem design                        |
| **1970s**        | Abelson & Sussman, _SICP_ (published 1985, taught 1980s)                 | First lecture-integrated problem sets; MIT 6.001 style with S-expressions, recursion, and environment models           |
| **1975**         | Aho, Hopcroft & Ullman, _The Design and Analysis of Computer Algorithms_ | Academic rigor in problem selection; introduced the "prove your algorithm" standard now used in university courses     |
| **1980s**        | ACM ICPC (International Collegiate Programming Contest)                  | Competitive problem sets with strict time/memory limits; standardized what "hard" means in algorithmic problem design  |
| **1986**         | Skiena, _The Algorithm Design Manual_                                    | Practitioner-oriented problems: real-world case studies, algorithm visualization, and a "catalog of problems" approach |
| **1995**         | UVa Online Judge                                                         | First web-based judge; introduced auto-judged problem sets to the public                                               |
| **2001**         | TopCoder                                                                 | Modern competitive programming platform; algorithm taxonomies (SRM) and difficulty ratings                             |
| **2008**         | LeetCode founded                                                         | Interview-focused problem sets; "Blind 75" and pattern-based curricula emerged from this era                           |
| **2009**         | HackerRank, Codility                                                     | Assessment-driven problem sets; auto-scored with test-case suites for hiring                                           |
| **2010**         | Codeforces                                                               | Real-time contest platforms; problem quality and editorial standards raised significantly                              |
| **2015–onwards** | "Grokking the Coding Interview" (Educative)                              | Pattern-based curricula; taught problem-solvers to classify problems before solving                                    |
| **2022**         | AlphaCode (DeepMind), GPT-4 problem generation                           | AI-generated algorithm problems; raises questions about problem novelty and solution verification                      |

### Why MIT 6.006 Problem Sets Exist

MIT 6.006 (Introduction to Algorithms) was designed to bridge a specific gap: lectures teach algorithmic _theory_ (proofs, complexity, data structures), but students need to translate theory into _working code under exam conditions_. The problem set format achieves this by:

1. **Part A (Theory):** Verifies you can reason about an algorithm without running it — the exam skill.
2. **Part B (Implementation):** Verifies you can translate reasoning into clean Java — the engineer skill.
3. **Part C (Challenge):** Pushes past rote application into proof and design — the researcher skill.

This tri-part structure (theory → implementation → proof/design) is why MIT 6.006 problem sets are harder to fake than competitive-programming judges: they test understanding, not just pattern-matching.

### Why Competitive Programming Emerged

ICPC emerged because universities needed a **standardized comparison** of student ability across institutions. The competitive programming format solved problems of fairness (uniform test conditions) and scalability (automated judging). UVa, TopCoder, and Codeforces built on this with online access, but retained the core ICPC assumption: problems are self-contained, have a single correct answer, and are solved in isolation.

### Why LeetCode Emerged

Post-2008 tech interview inflation (Google, Facebook, Amazon all adopted algorithm interviews simultaneously) created demand for interview-specific problem sets. LeetCode problems are not designed for academic rigor — they are designed to mirror the specific question types that appear in coding interviews (two-sum variants, tree path sums, sliding-window subarray problems). The "Blind 75" emerged as a community-curated set of high-signal interview problems.

### Key Distinction: Academic vs. Competitive vs. Interview Problem Sets

| Dimension                   | MIT 6.006 Style              | Competitive (ICPC/Codeforces) | Interview (LeetCode)            |
| --------------------------- | ---------------------------- | ----------------------------- | ------------------------------- |
| **Primary goal**            | Prove understanding          | Win contests                  | Pass interviews                 |
| **Answer format**           | Proof + code                 | Code only                     | Code only                       |
| **Erklärung / editorial**   | Explicit mistake taxonomy    | Sparse                        | Moderate                        |
| **Problem independence**    | Problems build on each other | Problems are isolated         | Patterns repeat across problems |
| **Time pressure**           | Exam conditions (50 min)     | Contest (2 hr)                | None                            |
| **Pattern-matching reward** | Low                          | High                          | High                            |

MIT 6.006 problem sets sit at the intersection: they test competitive-level algorithmic thinking but require the proof rigor of academic exercises.

---

## Problem-Solving Mental Models

Before attempting any problem in this file, internalize these three mental models. They are the constraint-first thinking framework used by every algorithm problem setter and almost every interview evaluator.

### Model 1: Constraint-First Reading

Before solving, identify the **constraint triple**:

```
(n: input size) + (time limit) + (memory limit)
```

- `n ≤ 10^5` → O(n log n) or O(n) solutions — O(n²) is too slow
- `n ≤ 10^6` → O(n) or O(1) space — consider streaming or in-place
- `n ≤ 10^2` → O(n²) may be acceptable — try brute force first
- `n = 1` or `n = 0` → edge cases, handle separately

**Example from Kadane's (DS-PS1 A3):** `n` is unspecified → assume general. You need O(n) because there's no constraint saying `n` is small. This immediately rules out O(n²) brute force (prefix sum of all subarrays).

### Model 2: Invariant Reasoning

Every algorithm preserves an **invariant** — a statement that holds true at every loop iteration. Finding the invariant _before coding_ is the single highest-leverage skill in algorithm problem solving.

**Kadane's invariant (DS-PS1 A3):**

> At each index `i`, `maxEndingHere` equals the maximum subarray sum of any subarray that **ends at index `i`**.

This is not stated in the problem body — it must be discovered. The invariant tells you exactly what decision to make at each step: restart if adding `arr[i]` hurts more than it helps.

**Monotonic stack invariant (DS-PS4 A1):**

> The stack always contains indices of elements for which no greater element has been found to the right, in **strictly decreasing value order**.

When a new element violates this order, you have found the next greater element for every popped index.

**Floyd cycle invariant (DS-PS3 A2):**

> Slow pointer and fast pointer, started together, maintain the invariant that the fast pointer is always exactly twice the distance of the slow pointer from the start. If a cycle exists, this distance eventually wraps to a multiple of the cycle length, causing a meeting.

### Model 3: Edge-Case Enumeration

Before finalizing any solution, enumerate the **edge-case matrix**:

| Edge case                                          | Why it matters                                          |
| -------------------------------------------------- | ------------------------------------------------------- |
| Empty input (`n = 0`)                              | Null checks, base case handling                         |
| Single element (`n = 1`)                           | No loop iterations, initialization correctness          |
| Two elements (`n = 2`)                             | Minimum non-trivial case, pointer advancement           |
| All equal elements                                 | Does your algorithm treat equal values correctly?       |
| Sorted input (ascending)                           | Some algorithms are optimized for sorted input          |
| Reverse sorted                                     | Can your algorithm handle worst-case ordering?          |
| All negative numbers                               | Kadane's initialization bug: never start `maxSoFar = 0` |
| All positive numbers                               | Kadane's always extends the subarray                    |
| Integer overflow (`n = 10^5`, values near INT_MAX) | Does your sum or product overflow?                      |
| Duplicate values                                   | Hash map collisions, two-pointer correctness            |

**Example:** Kadane's fails on `[-3, -2, -1]` if `maxSoFar` is initialized to `0` (returns `0` instead of `-1`). The correct initialization is `arr[0]`.

---

## Problem Set DS-PS1 — Arrays & Complexity

**Prerequisites:** `01a_Memory_Foundations.md`, `01b_Arrays.md`, `01_Algorithm_Thinking.md` §1-2

---

### Part A: Theoretical (Pen & Paper)

**A1 (Easy).** An array `a` of `n` integers is stored at memory address `base`. Each integer is 4 bytes. Derive a formula for the memory address of `a[i]` and explain why array access is O(1).

<details><summary>Answer</summary>

`address(a[i]) = base + i × 4`

Because the formula is a single multiplication + addition — it takes **constant time regardless of n**. This is the foundational reason arrays are O(1) random access: the CPU doesn't traverse elements, it computes the address directly.

🔴 **Erklärung (Common mistake):** Students often say "O(1) because it's fast." Speed is not the definition. O(1) means the time is _independent of n_. Even a slow O(1) operation remains O(1).

</details>

---

**A2 (Medium).** Analyze the time complexity of this code:

```java
for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) {
        System.out.println(i + ", " + j);
    }
}
```

Show your work step by step.

<details><summary>Answer</summary>

Outer loop runs n times. For each `i`, the inner loop runs `n - i` times.

Total iterations = `Σ(i=0 to n-1) (n - i) = n + (n-1) + ... + 1 = n(n+1)/2`

**Time Complexity: O(n²)**

🔴 **Erklärung:** A common error is to say "two nested loops = O(n²)." This is a shortcut, not a proof. The inner loop starts at `j = i`, NOT `j = 0`. You must sum the iterations correctly. If the inner loop always started at 0, it would still be O(n²), but for different reasons — always show the sum.

</details>

---

**A3 (Hard).** You are given an array of n integers. Design an algorithm to find the maximum subarray sum (Kadane's algorithm). Prove that your approach is correct by stating the invariant that holds at each step.

<details><summary>Answer</summary>

**Algorithm (Kadane's):**

```
maxSoFar = arr[0]
maxEndingHere = arr[0]
for i = 1 to n-1:
    maxEndingHere = max(arr[i], maxEndingHere + arr[i])
    maxSoFar = max(maxSoFar, maxEndingHere)
return maxSoFar
```

**Invariant:** At every step `i`, `maxEndingHere` holds the maximum subarray sum ending exactly at index `i`. The key decision: if adding `arr[i]` to the current subarray makes it worse than starting fresh at `arr[i]`, we restart.

**Proof:** The maximum subarray must end at _some_ index `k`. At step `k`, `maxEndingHere` correctly holds the max subarray ending at `k`. Since `maxSoFar` tracks the global max, it will capture this value.

**Time: O(n), Space: O(1)**

🔴 **Erklärung:** A common failure is returning `0` when all numbers are negative, thinking "empty subarray is 0." The problem asks for a _non-empty_ subarray. Initialize `maxSoFar = arr[0]` not `0`.

</details>

---

### Part B: Implementation

**B1.** Implement a `DynamicArray<T>` class in Java:

```java
// Skeleton — file: JavaSolutions/ps/ds/DynamicArray.java
public class DynamicArray<T> {
    private Object[] data;
    private int size;
    private int capacity;

    public DynamicArray() {
        // TODO: initialize with capacity 4
    }

    public void add(T element) {
        // TODO: add to end, resize when full (double capacity)
    }

    public T get(int index) {
        // TODO: bounds-check and return element
    }

    public void remove(int index) {
        // TODO: shift elements left, size--
    }

    public int size() { return size; }

    private void resize() {
        // TODO: allocate new array of 2x capacity, copy elements
    }
}
```

**JUnit Test Stub:**

```java
// JavaSolutions/ps/ds/DynamicArrayTest.java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class DynamicArrayTest {
    @Test void testAddAndGet() {
        var arr = new DynamicArray<Integer>();
        arr.add(1); arr.add(2); arr.add(3);
        assertEquals(3, arr.size());
        assertEquals(2, arr.get(1));
    }
    @Test void testResize() {
        var arr = new DynamicArray<Integer>();
        for (int i = 0; i < 10; i++) arr.add(i);
        assertEquals(10, arr.size());
        assertEquals(9, arr.get(9));
    }
    @Test void testRemove() {
        var arr = new DynamicArray<String>();
        arr.add("a"); arr.add("b"); arr.add("c");
        arr.remove(1);
        assertEquals(2, arr.size());
        assertEquals("c", arr.get(1));
    }
    @Test void testBoundsCheck() {
        var arr = new DynamicArray<Integer>();
        arr.add(42);
        assertThrows(IndexOutOfBoundsException.class, () -> arr.get(5));
    }
}
```

---

### Production Pattern Recognition: From Classroom to Production Systems

Each problem in this file maps to a real-world production system. Recognizing these mappings helps you remember the algorithm and understand why it matters beyond the whiteboard.

#### Kadane's Algorithm (Max Subarray Sum, DS-PS1 A3)

| Production System               | How It Uses Kadane's                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stock trading profit**        | Given daily price history, find the maximum profit from one buy-sell pair. This is exactly Kadane's: the "profit" at day `i` = price[i] - price[i-1]. The max subarray sum of daily deltas = max single-trade profit. |
| **Signal processing**           | Finding the peak signal segment in a noisy time-series (EEG, audio). Kadane's finds the contiguous window with maximum aggregate energy above the noise floor.                                                        |
| ** Genomics (BLAST alignment)** | Finding the maximum-scoring local alignment between DNA sequences. Smith-Waterman uses a 2D variant of Kadane's (max scoring submatrix).                                                                              |

**Code pattern in production:**

```java
// Kadane's for stock profit (LeetCode 121)
int maxProfit = 0;
int minPrice = prices[0];
for (int price : prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
}
// This is Kadane's in disguise: max(delta) subarray
```

#### Hash Map / Chaining (DS-PS2)

| Production System             | How It Uses Hash Tables                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Redis / Memcached**         | In-memory key-value stores use hash tables with chaining or open addressing for O(1) GET/SET. The load factor tuning (0.75) directly controls memory vs. latency tradeoffs. |
| **OAuth token validation**    | JWT or session tokens are validated by looking up a key (JTI, session ID) in a hash map. A mutable-key bug (DS-PS2 A2) would make tokens permanently unretrievable.         |
| **CDN request deduplication** | CDN edge nodes use hash maps to track recently seen request IDs and prevent replay attacks. Chaining handles hash collisions from crafted malicious headers.                |

**Code pattern in production:**

```java
// Simulating Redis GET with your ChainingHashMap
public String get(String key) {
    return map.get(key);  // O(1) average — used millions of times/sec per server
}
```

#### Two-Pointer / Sliding Window (DS-PS1 A2 — nested loop analysis; also DS-PS3)

| Production System                 | How It Uses Two-Pointers                                                                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Log stream merging**            | Real-time log aggregation (ELK stack, Splunk) merges multiple sorted log streams using a k-way merge — a generalization of two-pointer merging.                                                                |
| **Deduplication pipeline**        | Data pipelines processing sorted/ordered streams (user event logs, transaction records) use two-pointer deduplication when the stream is pre-sorted by key.                                                    |
| **Rate limiting**                 | Sliding window rate limiting in API gateways (Envoy, NGINX) maintains a sliding window of request timestamps. Each new request: add timestamp, evict timestamps outside window, check count. O(1) per request. |
| **Network throughput monitoring** | Sliding window TCP throughput calculation: measure bytes sent in the last `W` milliseconds. Kadane's-like logic detects sustained high-throughput bursts.                                                      |

**Code pattern in production:**

```java
// Rate limiter using sliding window (DS-PS1 A2 pattern)
public class SlidingWindowRateLimiter {
    private int windowMs;
    private int maxRequests;

    public SlidingWindowRateLimiter(int windowMs, int maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    public boolean allowRequest() {
        long now = System.currentTimeMillis();
        // Evict old entries (two-pointer: left index advances)
        while (!timestamps.isEmpty() && now - timestamps.peek() > windowMs) {
            timestamps.poll();
        }
        if (timestamps.size() < maxRequests) {
            timestamps.add(now);
            return true;
        }
        return false;
    }
}
```

#### Monotonic Stack (DS-PS4)

| Production System           | How It Uses Monotonic Stack                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stock span problem**      | Given daily stock prices, find for each day how many consecutive days the price was less than or equal to today. This is a direct next-greater-element problem — the stack gives the answer in O(n). |
| **HTML/JSON parsing**       | Tag-matching parsers use a stack to ensure balanced tags. A variant (next-closing-tag) uses a monotonic decreasing stack over tag precedence levels.                                                 |
| **Temperature forecasting** | Given daily temperatures, find for each day how many days until a warmer day (Next Greater Element). Weather APIs use this for "how long until it warms up" UI widgets.                              |

**Code pattern in production:**

```java
// Production: next greater element for stock span (Next Greater, DS-PS4 A1)
public int[] nextGreaterElement(int[] nums) {
    int[] result = new int[nums.length];
    Stack<Integer> stack = new Stack<>();
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];  // nums[i] is next greater for popped index
        }
        stack.push(i);
    }
    while (!stack.isEmpty()) result[stack.pop()] = -1;
    return result;
}
```

---

### Part C: Challenge (Design)

**C1.** Your `DynamicArray` doubles its capacity on resize. This causes amortized O(1) `add`. What happens to amortized complexity if you grow by only 1 slot each time instead? Prove your answer mathematically.

<details><summary>Answer</summary>

**If growth = +1 per resize:**

Adding element at size `n` requires copying all `n` existing elements. Over `n` insertions total:
Cost = 1 + 2 + 3 + ... + n = n(n+1)/2 = **O(n²) total**, so O(n) amortized per operation.

**If growth = ×2 per resize:**

Resizes happen at sizes 1, 2, 4, 8, ... Total copy work = 1 + 2 + 4 + ... + n/2 < 2n = **O(n) total**, so **O(1) amortized** per operation.

🔴 **Erklärung:** This is the core reason Java's `ArrayList` uses growth factor 1.5x–2x, not 1.1x or +1. Smaller growth factors cause quadratic amortized cost. This is a direct consequence of the geometric series sum.

</details>

---

## Problem Set DS-PS2 — Hash Tables

**Prerequisites:** `01e_HashTable.md`, `Ch08_Collections_Internals.md`

---

### Part A: Theoretical

**A1 (Easy).** In Java's `HashMap`, what is the load factor and why does exceeding it trigger a resize? What is the default threshold?

<details><summary>Answer</summary>

**Load factor** = number of entries / number of buckets. Java's default is **0.75**. When `size > capacity × loadFactor`, the hashmap resizes (doubles and rehashes).

**Why 0.75?** It balances time vs space: lower load factor = fewer collisions (faster) but more memory; higher = more collisions (slower). 0.75 is empirically chosen as the sweet spot.

🔴 **Erklärung:** Students confuse load factor with fill percentage. At load factor 0.75, not 75% of slots contain an entry — buckets can contain multiple entries via chaining. It's the _ratio of entries to buckets_, not a density measure.

</details>

---

**A2 (Medium).** Explain what happens when you use a mutable object as a `HashMap` key and then mutate it. Trace through the internal mechanics to explain why the entry becomes unretrievable.

<details><summary>Answer</summary>

`HashMap` stores the key's **hashCode** at insertion time and places the entry in bucket `hash(key) % capacity`.

When you mutate the key, its `hashCode()` changes. The next `get()` computes a **new bucket index** from the new hash, finds nothing, and returns `null` — even though the entry still exists in the old bucket.

**The ghost entry** lives in the map forever, wasting memory and causing a subtle correctness bug.

**Fix:** Always use **immutable keys** (String, Integer, UUID) or implement proper value-based immutability via DDD Value Objects.

🔴 **Erklärung:** This is one of the most common production bugs. The fix is not "override hashCode to return a constant" — that degrades performance to O(n) by forcing all keys into one bucket.

</details>

---

**A3 (Hard).** Java's `HashMap` uses tree-ification (converts a chain to a `TreeMap`-like Red-Black Tree) when a single bucket chain exceeds 8 entries. Why? Under what condition does this trigger, and what does it achieve?

<details><summary>Answer</summary>

Without tree-ification, a bucket chain is a `LinkedList`. If many keys hash to the same bucket (e.g., via a DoS attack using crafted hash collisions), all operations degrade to O(n).

**Tree-ification** converts the chain to a **Red-Black Tree** when chain length > 8. This provides O(log n) worst-case per bucket instead of O(n).

**Trigger condition:** Java also checks that the total map capacity is ≥ 64 before tree-ifying; otherwise it just resizes.

**📎 Reference Anchor:** [Java HashMap source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)  
**Invariant learned:** `TREEIFY_THRESHOLD = 8` is documented at line ~270.

🔴 **Erklärung:** Many developers believe Java HashMap is always O(1). This is only true for the amortized average case with good hash distribution. Worst-case without tree-ification is O(n), which becomes O(log n) with it.

</details>

---

### Part B: Implementation

**B2.** Implement a `ChainingHashMap<K,V>` from scratch using an array of linked lists:

```java
// Skeleton — JavaSolutions/ps/ds/ChainingHashMap.java
public class ChainingHashMap<K, V> {
    private static final int DEFAULT_CAPACITY = 16;
    private static final double LOAD_FACTOR = 0.75;

    private LinkedList<Entry<K,V>>[] buckets;
    private int size;

    record Entry<K, V>(K key, V value) {}

    @SuppressWarnings("unchecked")
    public ChainingHashMap() {
        // TODO: initialize buckets array
    }

    public void put(K key, V value) {
        // TODO: hash key, find bucket, check for existing key, add or update
        // TODO: if size > capacity * LOAD_FACTOR, resize()
    }

    public V get(K key) {
        // TODO: hash key, find bucket, linear search for key
    }

    public void remove(K key) {
        // TODO: hash key, find and remove entry
    }

    private int hash(K key) {
        // TODO: return Math.abs(key.hashCode()) % buckets.length
    }

    private void resize() {
        // TODO: double capacity, rehash ALL existing entries
    }
}
```

---

### Part C: Challenge

**C2.** Design a `TwoSumO1Space` solution using your `ChainingHashMap`. Then prove that the time complexity is O(n) and the space complexity is O(n). Why can't we solve Two Sum in O(1) space with O(n) time?

<details><summary>Answer</summary>

**O(1) space proof of impossibility:** To find if any pair sums to target in O(n) time, we need to check `target - arr[i]` for each element — this requires O(1) lookup, which demands storing previously seen elements. A sorted array allows O(n log n) sort + O(n) two-pointer search, giving O(n log n) time O(1) space trade-off. But O(n) time inherently requires the hash map's O(n) space to trade for the speed.

This is the time-space tradeoff — you cannot achieve both O(n) time and O(1) space simultaneously for this problem.

</details>

---

## Problem Set DS-PS3 — Linked Lists

**Prerequisites:** `01c_LinkedList.md`, `12_LinkedList_Plus_TwoPointers.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the time complexity of inserting an element at the head of a singly linked list vs an array? Explain why they differ.

<details><summary>Answer</summary>

**Linked List head insert:** O(1) — just update `newNode.next = head; head = newNode`. No shifting.

**Array head insert:** O(n) — all n existing elements must be shifted one position right to make room.

🔴 **Erklärung:** Students often think "both are just adding one element so they should be equal." The difference is memory layout. Array elements are contiguous — shifting is a physical memory copy. Linked list nodes are scattered — you just update two pointer values.

</details>

---

**A2 (Medium).** Trace Floyd's cycle detection algorithm on this list: `1 → 2 → 3 → 4 → 5 → 3` (node 5 points back to node 3). Show each step of slow/fast pointer movement until they meet.

<details><summary>Answer</summary>

Nodes: `1(pos0) → 2(pos1) → 3(pos2) → 4(pos3) → 5(pos4) → 3(pos2) [cycle]`

| Step  | Slow | Fast         |
| ----- | ---- | ------------ |
| Start | 1    | 1            |
| 1     | 2    | 3            |
| 2     | 3    | 5            |
| 3     | 4    | 4 ← **MEET** |

They meet at node `4`. A cycle exists.

**Finding entry point:** Move one pointer to head. Advance both one step at a time — they meet at cycle start (`3`).

🔴 **Erklärung:** Students often stop when they "detect" the cycle and forget the second phase (finding entry). In LeetCode 142 "Linked List Cycle II," the full problem requires the entry node, not just detection.

</details>

---

### Part B: Implementation

**B3.** Implement an LRU Cache using HashMap + DoublyLinkedList:

```java
// Skeleton — JavaSolutions/ps/ds/LRUCache.java
import java.util.HashMap;

public class LRUCache {
    private int capacity;
    private HashMap<Integer, Node> map;
    private Node head, tail; // dummy head and tail

    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    public LRUCache(int capacity) {
        // TODO: init capacity, map, dummy head/tail linked to each other
    }

    public int get(int key) {
        // TODO: if key in map, move node to front (most recent), return val
        // TODO: else return -1
    }

    public void put(int key, int value) {
        // TODO: if key exists, update value and move to front
        // TODO: else insert new node at front
        // TODO: if over capacity, evict node at tail (least recent)
    }

    private void moveToFront(Node node) { /* TODO */ }
    private void addToFront(Node node) { /* TODO */ }
    private void removeNode(Node node) { /* TODO */ }
}
```

---

## Problem Set DS-PS4 — Stacks & Queues

**Prerequisites:** `01d_Stack_Queue.md`, `15_Monotonic_Stack_Queue_Complete.md`

---

### Part A: Theoretical

**A1 (Medium).** Explain the **monotonic stack invariant** for the "Next Greater Element" problem. What property does the stack maintain at all times?

<details><summary>Answer</summary>

**Invariant:** At every step, the stack contains indices of elements for which we have **not yet found a greater element to the right**, in **monotonically decreasing order** from bottom to top.

When we see element `x`:

1. While stack top's value < `x`: pop it — `x` is its Next Greater Element.
2. Push `x`.

After processing all elements, remaining stack indices have **no greater element to the right** (answer = -1).

🔴 **Erklärung:** Students often confuse "monotonically decreasing stack" with "the elements are pushed in decreasing order." The stack stores _indices_, not values. The _values at those indices_ form a decreasing sequence.

</details>

---

**A2 (Hard).** The "Largest Rectangle in Histogram" problem uses a monotonic stack. Why does this work? Trace through bars `[2, 1, 5, 6, 2, 3]` showing each stack state.

<details><summary>Answer</summary>

**Key invariant:** We maintain a stack of bars in increasing height. When a bar is shorter than the top of the stack, we know the top bar's rectangle is bounded on the right. We pop and calculate: width = current_index - stack_top_after_pop - 1.

| i   | height | Stack (indices) | Action                                                     |
| --- | ------ | --------------- | ---------------------------------------------------------- |
| 0   | 2      | [0]             | push                                                       |
| 1   | 1      | [1]             | pop 0 (area=2×1=2), pop empty→area=1×1=1, push 1           |
| 2   | 5      | [1,2]           | push                                                       |
| 3   | 6      | [1,2,3]         | push                                                       |
| 4   | 2      | [1,4]           | pop 3 (area=6×1=6), pop 2 (area=5×2=10), push 4            |
| 5   | 3      | [1,4,5]         | push                                                       |
| end | —      | —               | pop 5 (area=3×1=3), pop 4 (area=2×2=4), pop 1 (area=1×6=6) |

**Maximum = 10** ✓

</details>
## Problem Pattern Catalog

This catalog maps every problem type in this file to its canonical solution approaches. Use it when you see a new problem — classify it first, then apply the matching pattern.

### How to Use This Catalog

1. **Identify the constraint type** (input size, time limit, space limit) to narrow the feasible complexity.
2. **Classify the problem type** from the left column.
3. **Match to a canonical approach** from the right column.
4. **Verify with a mental trace** on a small example before coding.

### Pattern Table

| Problem Type                       | Canonical Approaches                                                                                | Problems in This File |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------- |
| **Max subarray sum**               | Kadane's (O(n), O(1) space), Prefix sum + hashmap (O(n), O(n) space)                                | DS-PS1 A3             |
| **Two-sum**                        | Hash map (O(n) time, O(n) space), Two pointers on sorted array (O(n log n) time, O(1) space)        | DS-PS2 C2             |
| **Cycle detection**                | Floyd's tortoise and hare (O(n) time, O(1) space), Mark-visited (O(n) time, O(n) space)             | DS-PS3 A2             |
| **LRU cache**                      | HashMap + DoublyLinkedList (O(1) all ops), LinkedHashMap ordering (O(1) get, O(n) worst-case put)   | DS-PS3 B3             |
| **Hash map collisions**            | Chaining (linked list → treeify at TREEIFY_THRESHOLD=8), Open addressing (linear/quadratic probing) | DS-PS2 A3, B2         |
| **Mutable key bugs**               | Immutable keys (String, Integer, UUID), DDD Value Objects                                           | DS-PS2 A2             |
| **Next greater element**           | Monotonic decreasing stack (O(n) time, O(n) space)                                                  | DS-PS4 A1             |
| **Largest rectangle in histogram** | Monotonic stack (O(n) time, O(n) space), Divide and conquer (O(n log n))                            | DS-PS4 A2             |
| **Array random access analysis**   | Address formula: `base + i × sizeof(element)`                                                       | DS-PS1 A1             |
| **Nested loop summation**          | Sum the iterations: `Σ(i=0 to n-1) (n - i) = n(n+1)/2`                                              | DS-PS1 A2             |
| **Amortized analysis**             | Geometric series trick: `1 + 2 + 4 + ... + n = 2n - 1`                                              | DS-PS1 C1             |
| **Load factor resizing**           | Resize when `size > capacity × load_factor`; geometric growth gives O(1) amortized                  | DS-PS2 A1             |
| **Array vs. linked list insert**   | Array: O(n) shift; Linked list: O(1) pointer update                                                 | DS-PS3 A1             |

### Variant Taxonomy (When the Problem Changes Slightly)

| Base Problem            | Variant                              | What Changes                                                                   |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Kadane's (max subarray) | Maximum product subarray             | Use max and min simultaneously (handles negative × negative)                   |
| Kadane's (max subarray) | Max subarray sum with circular array | Consider wrap-around: max of (normal max, total_sum - normal_min)              |
| Two-sum                 | 3-sum, 4-sum                         | Sort + two/three pointers; complexity O(n²) and O(n³)                          |
| Two-sum                 | Two-sum with duplicate values        | Use hashmap count, handle value == target/2 specially                          |
| Hash map                | LRU cache                            | Add ordering: doubly linked list or LinkedHashMap                              |
| Hash map                | Bloom filter                         | Probabilistic version: no delete, false positives possible                     |
| Monotonic stack         | Next smaller element                 | Reverse the inequality (pop while `stack_top >= current`)                      |
| Monotonic stack         | Largest rectangle in histogram       | For each bar: pop until stack_top < current_height                             |
| Floyd's cycle           | Find cycle start node                | After meeting, move one pointer to head; advance both one step until they meet |
| Floyd's cycle           | Happy number                         | Floyd's on digit-square-sum sequence; 1 = cycle end                            |

### Mental Model: Problem Classification Decision Tree

```
Is the input sorted or sortable?
├─ YES → Can I use two pointers? (two-sum, merge, palindrome)
│         ├─ YES (sorted, two pointers) → O(n) solution
│         └─ NO (need hash lookup) → O(n) hashmap solution
└─ NO → Is the problem about a contiguous subarray?
          ├─ YES → Kadane's algorithm (O(n), O(1) space)
          └─ NO → Is it about "next greater/smaller"?
                    ├─ YES → Monotonic stack (O(n), O(n) space)
                    └─ NO → Is it about caching / eviction?
                              ├─ YES → HashMap + DoublyLinkedList (O(1) all ops)
                              └─ NO → Does it involve cycles?
                                        ├─ YES → Floyd's tortoise and hare (O(1) space)
                                        └─ NO → Fall back to brute force + optimize
```

### Cross-Reference to Algorithms Problem Sets

The following problem types are continued in `../03_Algorithms/03_PROBLEM_SETS.md`:

| Problem Type                                  | Where to Find More           |
| --------------------------------------------- | ---------------------------- |
| Tree traversals (BFS, DFS, Morris O(1) space) | `03_PROBLEM_SETS.md` DS-PS5  |
| Heap / priority queue problems                | `03_PROBLEM_SETS.md` DS-PS6  |
| Graph shortest paths (Dijkstra, Bellman-Ford) | `03_PROBLEM_SETS.md` DS-PS7  |
| Dynamic programming (subarray DP)             | `03_PROBLEM_SETS.md` DS-PS8  |
| Divide and conquer (merge sort, closest pair) | `03_PROBLEM_SETS.md` DS-PS9  |
| String algorithms (KMP, Rabin-Karp)           | `03_PROBLEM_SETS.md` DS-PS10 |

---

_More problem sets: DS-PS5 (Trees) and DS-PS6 (Heaps) are embedded in `03_Algorithms/03_PROBLEM_SETS.md` since trees/heaps blend DS and algorithm content._

---

[← Back to Semester 1](../00_CURRICULUM/SEMESTER_1_GUIDE.md) | [Algorithms Problem Sets →](../03_Algorithms/03_PROBLEM_SETS.md)

---

# 🎓 University-Level Exam Problem Bank

> **Purpose:** This addendum provides at least 2 exam-style problems per core data structure, in the format used by MIT 6.006 / ETH / KTH. Each problem has: constraints, DS choice rationale, solution sketch, edge cases, and Erklärung (common mistakes). Use these as a self-test: if you can solve a problem in < 30 minutes without looking at the solution, the corresponding chapter is internalized.

## DS-PS-A1 — Array Exam Problems

### Problem A1.1 — Kadane's Algorithm Correctness Proof

**Problem:** Prove that Kadane's algorithm (greedy local maximum) correctly computes the maximum sum of any contiguous subarray.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(1).

**DS choice:** Contiguous array; the input is already in array form. No auxiliary DS.

**Algorithm:** Walk once; maintain `currentMax` (max sum ending at index i). Reset to 0 when negative.

**Solution sketch:**
```
currentMax = arr[0]; globalMax = arr[0]
for i = 1 to n-1:
    currentMax = max(arr[i], currentMax + arr[i])
    globalMax = max(globalMax, currentMax)
return globalMax
```

**Edge cases:**
- All negative: `globalMax` = max element, not 0 (unless empty)
- Single element: `globalMax` = arr[0]
- All zeros: `globalMax` = 0
- Mix of positive/negative: standard case

**Erklärung (common mistakes):**
- ❌ Setting `globalMax = 0` for all-negative inputs — should be max element
- ❌ Forgetting to handle n = 0 (return 0 by convention or throw)
- ❌ Using `Integer.MIN_VALUE` as initial value but `currentMax + arr[i]` overflows on big inputs (use `long`)
- ❌ Confusing "max sum ending here" with "max sum so far"

**Correctness proof sketch (induction on i):**
- Base case (i = 0): `currentMax = arr[0]`, `globalMax = arr[0]`. Both correct.
- Inductive step: assume true for i-1. At i, either:
  - Start new subarray at i: `arr[i]`
  - Extend previous: `currentMax[i-1] + arr[i]`
  - The optimal choice for "max sum ending at i" is max of these two.
- `globalMax[i] = max(globalMax[i-1], currentMax[i])`. By induction, both are correct.

### Problem A1.2 — Geometric Series Amortized Cost

**Problem:** A custom array-backed list grows by adding 1 to its capacity each time it fills up (instead of doubling). Prove that append is O(n) amortized, not O(1).

**Constraints:** n elements inserted one at a time; capacity starts at 1.

**DS choice:** Array-backed list with linear growth.

**Algorithm:** Each resize copies all existing elements; cost = current size.

**Solution sketch:** Total work = 1 + 2 + 3 + ... + n = n(n+1)/2 = O(n²). Amortized per append = O(n).

**Edge cases:**
- n = 0: trivial
- n = 1: one copy; O(1)
- n large: O(n²) total

**Erklärung:**
- ❌ Assuming "copy once per resize" → O(1) amortized. WRONG — count total copies, not per-resize.
- ❌ Confusing worst-case per-op (O(n)) with amortized (O(n)). Both are O(n) for linear growth.

**Proof sketch:** The geometric-series argument requires geometric (e.g., 1.5×) growth. With linear growth, the series is arithmetic, not geometric. The 17th append copies 17 elements; the millionth append copies 10⁶ elements.

## DS-PS-L1 — Linked List Exam Problems

### Problem L1.1 — Floyd's Cycle Detection Proof

**Problem:** Prove that Floyd's tortoise-and-hare algorithm detects a cycle in a linked list in O(n) time and O(1) space.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(1).

**DS choice:** Singly linked list.

**Algorithm:** Slow pointer moves 1 step; fast moves 2 steps. If they meet, there's a cycle.

**Solution sketch:** See `01c_LinkedList.md` addendum.

**Edge cases:**
- Empty list (no cycle)
- Single node self-loop
- Cycle at tail
- Long list without cycle

**Erklärung:**
- ❌ Forgetting `fast != null && fast.next != null` check → NPE
- ❌ Confusing "they meet" with "they're at the same node" — they meet at some node in the cycle, not necessarily at the cycle's entry
- ❌ Claiming O(n) without proof — it's O(n) only when the cycle analysis is included

### Problem L1.2 — Reverse in Groups of K

**Problem:** Reverse every K nodes in a linked list. If the remaining nodes are < K, leave them as-is.

**Constraints:** n ≤ 10⁶, K ≤ n, time = O(n), memory = O(1) auxiliary.

**DS choice:** Singly linked list.

**Algorithm:** Walk K nodes; reverse that segment; link to next segment.

**Solution sketch:**
```
def reverseKGroup(head, k):
    dummy = Node(0, head)
    groupPrev = dummy
    while True:
        kth = getKth(groupPrev, k)
        if kth is None: break
        groupNext = kth.next
        # reverse groupPrev.next ... kth
        prev, curr = groupNext, groupPrev.next
        while curr != groupNext:
            tmp = curr.next
            curr.next = prev
            prev = curr
            curr = tmp
        tmp = groupPrev.next
        groupPrev.next = kth
        groupPrev = tmp
    return dummy.next
```

**Edge cases:**
- n = 0 (return null)
- n = K (full reverse)
- n < K (no reverse)
- K = 1 (no-op)
- K = n (full reverse)
- Remaining nodes < K (leave as-is)

**Erklärung:**
- ❌ Losing reference to `groupPrev.next` after mutation
- ❌ Forgetting to check if K nodes exist before reversing
- ❌ Off-by-one in the loop (should be `while curr != groupNext`)

## DS-PS-SQ1 — Stack/Queue Exam Problems

### Problem SQ1.1 — Valid Parentheses with Multiple Types

**Problem:** Given a string containing `()[]{}`, determine if all brackets are correctly matched and nested.

**Constraints:** |s| ≤ 10⁴, time = O(n), memory = O(n).

**DS choice:** Stack (LIFO matches the nesting structure).

**Algorithm:** Push opening brackets; for closing, pop and check match.

**Solution sketch:**
```
stack = empty
for char in s:
    if char in "([{":
        stack.push(char)
    else:
        if stack.isEmpty(): return false
        top = stack.pop()
        if (top, char) not in [("(", ")"), ("[", "]"), ("{", "}")]: return false
return stack.isEmpty()
```

**Edge cases:**
- Empty string (valid)
- Single bracket (invalid)
- All opening (invalid)
- All closing (invalid)
- Nested deeply (stack depth = n/2)

**Erklärung:**
- ❌ Forgetting to check `stack.isEmpty()` before popping
- ❌ Using a HashMap for matching instead of a switch (slower but correct)
- ❌ Returning `true` when stack is non-empty (must be empty)

### Problem SQ1.2 — Sliding Window Maximum

**Problem:** Given array of size n and window size k, find max in each window.

**Constraints:** n ≤ 10⁶, k ≤ n, time = O(n), memory = O(k).

**DS choice:** Monotonic deque (store indices of elements in decreasing value order).

**Algorithm:** For each i, remove indices < i-k from head; remove indices with smaller values from tail; add i; record head's value.

**Solution sketch:**
```
deque = empty  // stores indices
result = []
for i = 0 to n-1:
    while deque not empty and deque.first < i - k:
        deque.removeFirst()
    while deque not empty and arr[deque.last] < arr[i]:
        deque.removeLast()
    deque.addLast(i)
    if i >= k - 1:
        result.append(arr[deque.first])
return result
```

**Edge cases:**
- k = 1 (each element is its own max)
- k = n (max is overall max)
- All same values (any max works)
- Strictly decreasing (no removal from tail until window slides)

**Erklärung:**
- ❌ Using a heap → O(n log k) instead of O(n)
- ❌ Forgetting to remove indices < i-k from head
- ❌ Recording deque.first's value but deque.first is the *index*, not the value

## DS-PS-H1 — Hash Table Exam Problems

### Problem H1.1 — Two-Sum in O(n)

**Problem:** Given an array and a target, find indices of two elements summing to target.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(n).

**DS choice:** HashMap (O(1) avg lookup of complement).

**Algorithm:** Single pass; for each element, check if `target - element` is in the map.

**Solution sketch:**
```
map = HashMap<Integer, Integer>  // value → index
for i = 0 to n-1:
    complement = target - arr[i]
    if map.containsKey(complement):
        return [map.get(complement), i]
    map.put(arr[i], i)
return []  // no solution
```

**Edge cases:**
- Empty array (return [])
- Single element (return [])
- Two same elements summing to target (e.g., [3, 3], target = 6)
- Negative numbers
- Multiple solutions (return any)

**Erklärung:**
- ❌ Sorting first → O(n log n) but correct; the O(n) solution requires hash map
- ❌ Using `getOrDefault` to handle the same-element case incorrectly
- ❌ Returning the wrong index order (must be earlier index first)

### Problem H1.2 — LRU Cache Implementation

**Problem:** Implement an LRU cache with O(1) get and put.

**Constraints:** capacity ≤ 10⁴, time = O(1) per op, memory = O(capacity).

**DS choice:** HashMap + Doubly Linked List.

**Algorithm:** See `00_DS_PROBLEM_BRIDGES.md` Bridge 4.

**Solution sketch:** See earlier; combine HashMap<K, Node> with DLL of nodes.

**Edge cases:**
- Empty cache (first put)
- Capacity = 1 (constant eviction)
- Re-insert existing key (update value, move to tail)
- Negative capacity (throw)
- Concurrent access (use synchronized or ConcurrentHashMap)

**Erklärung:**
- ❌ Using a TreeMap → O(log n) per op, not O(1)
- ❌ Forgetting to remove from DLL when evicting
- ❌ Using a singly LL → O(n) for `remove(node)`, not O(1)

## DS-PS-T1 — Tree/Heap Exam Problems

### Problem T1.1 — Validate BST

**Problem:** Determine if a binary tree is a valid BST (left subtree keys < node key ≤ right subtree keys).

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(h).

**DS choice:** BST with strict ordering invariant.

**Algorithm:** In-order traversal; track previous value; ensure strictly increasing.

**Solution sketch:**
```
def isValidBST(root):
    stack = []
    prev = -infinity
    curr = root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        if curr.val <= prev: return False
        prev = curr.val
        curr = curr.right
    return True
```

**Edge cases:**
- Empty tree (valid)
- Single node (valid)
- Duplicate keys (depends on strict vs non-strict)
- Right-skewed tree (valid)
- Tree where left subtree has a key > root.key (invalid)

**Erklärung:**
- ❌ Just checking `node.left.val < node.val && node.val < node.right.val` — fails on cross-subtree violations (e.g., left subtree's right child > root)
- ❌ Using recursion on a deep tree → stack overflow
- ❌ Not handling duplicates consistently

### Problem T1.2 — Top-K Frequent Elements

**Problem:** Given an array, return the K most frequent elements.

**Constraints:** n ≤ 10⁶, K ≤ unique count, time = O(n log K), memory = O(n).

**DS choice:** HashMap (counting) + Min-Heap of size K (selection).

**Algorithm:** Count with HashMap; maintain min-heap of size K by frequency.

**Solution sketch:**
```
count = HashMap<Integer, Integer>
for x in arr: count.merge(x, 1, Integer::sum)

heap = PriorityQueue<Map.Entry<Integer, Integer>>(
    Comparator.comparingInt(Map.Entry::getValue))
for entry in count.entrySet():
    heap.offer(entry)
    if heap.size() > K: heap.poll()

return heap.stream().map(Map.Entry::getKey).collect(toList())
```

**Edge cases:**
- n = 0 (return [])
- K = 0 (return [])
- All elements equal (return [theElement])
- K > unique count (return all unique)

**Erklärung:**
- ❌ Using a max-heap → O(n log n), not O(n log K)
- ❌ Using sort → O(n log n), not O(n log K)
- ❌ Forgetting to handle K > unique count

## DS-PS-M1 — Miscellaneous Exam Problems (Mixed DS)

### Problem M1.1 — Design a Tweet Timeline

**Problem:** Design a function that returns the 10 most recent tweets for a user, given 10⁹ tweets total.

**Constraints:** users ≤ 10⁶, tweets per user ≤ 10⁶, query latency ≤ 100 ms.

**DS choice:** Max-heap (per user) or sorted index (global).

**Algorithm:** Maintain a per-user heap of tweets (by timestamp); for query, extract top 10.

**Solution sketch:**
```
class TimelineService:
    Map<UserId, PriorityQueue<Tweet>> userTimelines  // max-heap by timestamp
    
    postTweet(userId, tweet):
        if !userTimelines.containsKey(userId):
            userTimelines.put(userId, new PriorityQueue<>(...))
        userTimelines.get(userId).offer(tweet)
    
    getNewsFeed(userId):
        heap = userTimelines.get(userId)  // assume follows self
        for followee in userId.getFollowees():
            heap = mergeHeap(heap, userTimelines.get(followee))
        return top 10 from heap
```

**Trade-offs:**
- Memory: O(tweets) per user × users
- Query latency: O(log tweets) per extract × 10
- Alternative: pre-computed materialized view (faster query, slower write)

**Erklärung:**
- ❌ Loading all tweets and sorting → O(n log n), too slow for 10⁹
- ❌ Using SQL `ORDER BY timestamp DESC LIMIT 10` without index → O(n log n)
- ❌ Forgetting to merge timelines of followees

### Problem M1.2 — Implement a Rate Limiter

**Problem:** Limit a user to N requests per second.

**Constraints:** users ≤ 10⁶, requests/sec/user ≤ N ≤ 100, decision latency ≤ 1 ms.

**DS choice:** Sliding window with deque of timestamps OR token bucket.

**Algorithm (sliding window):**
```
class RateLimiter:
    Map<UserId, Deque<Long>> userTimestamps  // long = ms since epoch
    
    allow(userId):
        now = System.currentTimeMillis()
        window = userTimestamps.computeIfAbsent(userId, k -> new ArrayDeque<>())
        while !window.isEmpty() and window.peekFirst() < now - 1000:
            window.pollFirst()
        if window.size() >= N: return false
        window.offerLast(now)
        return true
```

**Edge cases:**
- New user (first request allowed)
- Burst at boundary (requests spanning 2 windows)
- Clock skew across servers (use monotonic clock)
- Distributed deployment (use Redis sorted set)

**Erklärung:**
- ❌ Using fixed window → burst at window boundaries
- ❌ Forgetting to evict old timestamps → memory leak
- ❌ Using wall-clock time instead of monotonic time → clock jumps break the algorithm

## Cross-References

- **`02_PROBLEM_SETS.md`** Part A and Part B (in body above) — original MIT 6.006 problem sets.
- **`00_DS_PROBLEM_BRIDGES.md`** — constraint-first bridge template applied to each DS.
- **`01a_Memory_Foundations.md`** through **`01f_Trees_Heaps.md`** — chapter-by-chapter problems and proofs.
- **`02_PROBLEM_SETS.md`** Model 1 / 2 / 3 (Constraint-First, Invariant Reasoning, Edge-Case Enumeration) — the three reasoning models applied throughout.
