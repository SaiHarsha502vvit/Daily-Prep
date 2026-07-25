**Navigation**: [< Previous Chapter](01a_Memory_Foundations.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01c_LinkedList.md)

---

# 📚 Part 0: Complete Understanding + Growth Mindset

**🎯 Goal:** Understand what data structures are, why they exist, and develop the right mindset for mastering them.

## 5W1H — Why This Chapter?

> WHAT: The foundation of all data organization—Arrays and general data structure theory.
>
> WHY: Arrays are the primitive building block. Without understanding contiguous memory and O(1) index access, you cannot deeply understand why other structures (like Linked Lists or Trees) were invented to solve array limitations.
>
> WHO: Anyone beginning the journey into algorithms and memory management.
>
> WHEN: This is step one. Master this before moving to more complex dynamic structures.
>
> HOW: By understanding array memory layout, CPU cache locality, and foundational traversal and sub-array patterns.

---

## 🎓 University Proof Corner

> **MIT 6.006 L9 / KTH DD1352 / TU Munich IN0007 layer** — Why dynamic arrays (ArrayList/Vector) achieve O(1) amortized append despite occasional O(n) copy operations.

### Amortized Analysis: Dynamic Array Doubling

A dynamic array doubles its capacity when full. Appending n elements triggers resizes at sizes 1, 2, 4, 8, ..., n. The copy costs are:

```
1 + 2 + 4 + 8 + ... + n  =  2n − 1   total element copies
```

Divided across n appends: **(2n − 1) / n < 2 = O(1) amortized per append**.

This is the **aggregate method**: total cost / total operations.

**Accounting method (banker's metaphor)**: charge each `append` 3 units — 1 to insert, 1 "saved" for its own future copy, 1 "saved" for an element copied last resize. When resize happens, every element has pre-paid its copy cost. The bank never goes negative. ✓

### Why Halving on Delete Needs a Threshold

If you shrink at half-full, a sequence of alternating insert/delete at the boundary triggers O(n) resize on every operation — Θ(1) amortized breaks. The fix: shrink only at **quarter-full** (the standard). Then:
- After shrinking, the array is half-full — insert n/4 more before the next resize.
- Cost is amortized over those n/4 operations → still O(1). ✓

### Static vs Dynamic Arrays: When the Constant Factor Matters

Dynamic array doubling wastes up to 50% of allocated memory. For latency-critical systems where a single resize spike is unacceptable, pre-size the array to the known maximum or use a growth factor < 2 (Python uses ~1.125; this trades memory for smoother resize costs).

> Full amortized analysis (all 3 methods): [A2 — Complexity from First Principles](../03_Algorithms/A2_Complexity_FirstPrinciples.md) (Section 5: Amortized Analysis)

---

## 📦 What Are Data Structures?

A **data structure** is a way of ORGANIZING and STORING data so that we can perform OPERATIONS efficiently.

💡 **Key Insight:** It's not just about _storing_ data — it's about making certain _operations_ fast!

**Analogy — Same Books, Different Organizations:**

- Library with books thrown randomly → Hard to find books
- Library with books sorted by topic → Easy to find by topic
- Library with books sorted by author → Easy to find by author

Same books, different organizations, different speeds for different tasks!

### Historical Evolution

| Year  | Innovation           | Motivation                                      |
| ----- | -------------------- | ----------------------------------------------- |
| 1945  | First computers      | Data just thrown in memory                      |
| 1950s | **Arrays**           | Need for sequential data                        |
| 1956  | **Linked Lists**     | Need for dynamic size                           |
| 1960s | **Stacks, Queues**   | Need for order control                          |
| 1962  | **AVL Trees**        | Need for balanced search                        |
| 1972  | **B-Trees**          | Need for database indexing                      |
| 1984  | **Skip Lists**       | Probabilistic alternative to trees              |
| 1990s | **Hash structures**  | O(1) lookup need                                |
| 2006  | **NumPy** (Python)   | N-dimensional array ops, vectorized math        |
| 2008  | **Pandas**           | Columnar data frames built on NumPy             |
| 2016  | **Apache Arrow**     | Cross-language columnar array format            |
| 2020s | **ML tensor arrays** | GPU-accelerated array primitives (PyTorch, JAX) |

---

## ❓ What Problem Do Data Structures Solve?

**Core Problem: Operations are too slow!**

Consider 1 million user accounts — the DS you choose determines performance:

| Operation       | Unsorted List | Sorted Array  | HashMap       |
| --------------- | ------------- | ------------- | ------------- |
| Find user by ID | 1 million ops | 20 ops        | **1 op**      |
| Add new user    | **1 op**      | 1 million ops | **1 op**      |
| Delete user     | 1 million ops | 1 million ops | **1 op**      |
| List all users  | 1 million ops | 1 million ops | 1 million ops |

⚠️ **Trade-Off:** Every DS is GOOD at some operations and BAD at others.
There is NO perfect data structure — only the **perfect choice for your problem!**

🔬 **Challenge — Trade-Off Deep Dive:**

> When would a 1D array of `int[1_000_000]` be _slower_ than `int[1000][1000]`? (Hint: think about CPU cache lines and strided access.)
>
> <details><summary>Answer</summary>
>
> **Answer:** In the common case of _row-by-row traversal_, both layouts perform equally since rows fit neatly into cache lines. The performance gap appears in **column-wise traversal** (accessing every 1000th element):
>
> - `int[1_000_000]` (flat): accesses strided elements — each access is a cache **miss**, since each row of 1000 elements sits on a different cache line (64 bytes). Miss rate ~100%.
> - `int[1000][1000]` (2D): accessing `arr[r][c]` still requires `arr[r]` base + offset. However, the 2D form's **inner loop** over columns is still contiguous. The real win is that each inner row (1000 ints = 4000 bytes) spans ~62 cache lines — so the first access in a row is a miss, but the next 15 elements hit.
>
> **Bottom line:** For 2D matrix problems, using a `int[rows][cols]` lets the JIT optimize inner loops as contiguous. But when writing a `int[1_000_000]` flat array and iterating column-major, each `arr[i * cols + c]` is a potential cache-line boundary — up to 1000x slower than the equivalent `arr[c]` in a true 2D layout.
>
> **Rule of thumb:** Choose the array layout that matches your access pattern. Row-major loop → flat 1D. Column-major → prefer 2D or transpose first.
>
> </details>

---

## 📖 Why Learn Data Structures?

1. **Performance** — Same problem can be 1000x faster with the right DS
   - Finding a word in dictionary: Linear search checks 170,000 words. Binary search checks only **18**!

2. **Scalability** — Programs must handle growth
   - O(n²) works for 1,000 items but crashes with 1 million
   - Right DS keeps O(log n) even at scale

3. **Problem Modeling** — DS helps you THINK about problems
   - Hierarchy? → **Tree** · Relationships? → **Graph** · Fast lookup? → **HashMap** · Order matters? → **Stack/Queue**

4. **Foundation** — Advanced concepts BUILD on DS
   - Databases use B-Trees · Networks use Graphs · Compilers use Stacks · OS uses Queues

---

## ⭐ Growth Mindset: Choosing & Creating Data Structures

❌ **Don't:** "I need to memorize all data structures"
✅ **Do:** "I need to understand WHAT operations each DS optimizes for"

### The Selection Framework

1. List ALL operations you need
2. Mark which operations are **MOST FREQUENT**
3. Find DS that makes frequent operations **FAST**
4. Accept that rare operations might be slow

### Quick Selection Guide

| Need                        | Use                      |
| --------------------------- | ------------------------ |
| Fast access by index        | **Array**                |
| Fast insert/delete anywhere | **LinkedList**           |
| LIFO (Last In First Out)    | **Stack**                |
| FIFO (First In First Out)   | **Queue**                |
| Fast lookup by key          | **HashMap**              |
| Fast lookup + sorted order  | **TreeMap**              |
| Unique elements only        | **Set**                  |
| Hierarchical relationships  | **Tree**                 |
| Complex relationships       | **Graph**                |
| Priority-based access       | **Heap / PriorityQueue** |

💡 **When no existing DS fits → Create your own by COMBINING!**

- **LRU Cache** = HashMap + DoublyLinkedList
- **MinStack** = Stack + Stack (for mins)
- **Trie** = Tree with characters as edges
- **Graph with fast lookup** = Adjacency List using HashMap

---

## 🧗 Common Difficulties in Learning DS

| Difficulty                                                | Solution                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| "Too many DS to learn!"                                   | Master the **10 core DS** first: Array, List, Stack, Queue, HashMap, Set, Tree, Heap, Graph, Trie |
| "I know DS but don't know when to use it"                 | Focus on **OPERATIONS** each DS optimizes                                                         |
| "I understand concept but can't implement"                | **Draw pictures first**, code follows naturally                                                   |
| "Array is O(1), HashMap is O(1) — what's the difference?" | Array: O(1) by **INDEX** · HashMap: O(1) by **KEY**                                               |
| "Each DS feels completely different"                      | See how DS **COMBINE**: TreeMap = Tree + Map, HashSet = HashMap with only keys                    |

---

## 🎯 Expected Outcomes of Mastering DS

- ✅ **Instant Recognition** — See problem → Know which DS fits
- ✅ **Trade-Off Analysis** — Understand costs of each choice
- ✅ **Combination Skills** — Combine DS to solve complex problems
- ✅ **Implementation** — Code any DS from scratch
- ✅ **Debugging** — Recognize DS-related bugs quickly
- ✅ **Optimization** — Know when to switch DS for better performance
- ✅ **Creation** — Design custom DS when needed

🔄 **The Transformation:**
FROM: "I'll try arrays for everything"
TO: "I'll choose the **RIGHT DS** for each operation"

---

# ❓ Part 1: Why Data Structures Exist

## The Origin Story

**1950s:** Computers had **LIMITED memory** (just a few KB).
The problem was clear — _how do you organize data efficiently?_
The solution: **Data Structures were born!**

Every DS was created to solve a **SPECIFIC** problem:

| Data Structure | Created For                    |
| -------------- | ------------------------------ |
| **Array**      | Fast access by position        |
| **LinkedList** | Fast insertion/deletion        |
| **Stack**      | Last-In-First-Out (LIFO)       |
| **Queue**      | First-In-First-Out (FIFO)      |
| **Tree**       | Hierarchical data              |
| **Graph**      | Relationships between entities |
| **HashMap**    | O(1) lookup                    |

---

# 📊 Part 2: Arrays

### 5W1H: Deep Understanding of Arrays

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: An array is a CONTIGUOUS block of memory storing elements    ║
║        of the SAME TYPE at consecutive addresses.                    ║
║                                                                      ║
║  WHY:  Arrays exploit how CPU hardware works:                        ║
║        • O(1) access: address = base + (index × size)               ║
║        • Cache-friendly: contiguous data → fewer cache misses        ║
║        • Simplest data structure with the best raw performance       ║
║                                                                      ║
║  WHEN to use Arrays:                                                 ║
║        ✔ Random access by index is frequent                          ║
║        ✔ Size is known in advance (or rarely changes)                ║
║        ✔ Sequential iteration (cache locality = 10x faster)          ║
║        ✘ Frequent insertions/deletions at arbitrary positions        ║
║        ✘ Unknown or wildly varying size at runtime                    ║
║                                                                      ║
║  WHERE arrays appear in production:                                  ║
║        • Database pages are arrays of records (fixed-size pages)     ║
║        • Image pixels: 2D array of RGB values                        ║
║        • Network buffers: byte arrays holding packet data            ║
║        • GPU matrices: arrays for parallel computation               ║
║                                                                      ║
║  HOW (JVM internals):                                                ║
║  Java `int[] arr = new int[6]`:                                      ║
║  1. JVM allocates 24 bytes (6 × 4) PLUS 16 bytes object header      ║
║     (mark word + klass pointer + array length) = 40 bytes total     ║
║  2. All 24 bytes are CONTIGUOUS in heap memory                       ║
║  3. JVM stores the array length (arr.length is O(1))                 ║
║  4. Bounds checking: arr[i] verifies 0 ≤ i < length (throws AIOOBE) ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 🔒 Array Invariants (Always True — Never Assumptions)

| Invariant                             | Expression                                                                                                                              | Violation Result                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Bounds invariant**                  | `0 <= index < length` for all valid accesses                                                                                            | `ArrayIndexOutOfBoundsException` at runtime                 |
| **Contiguity invariant**              | All elements live at `base + k * elementSize` for `k = 0..n-1`                                                                          | Corrupted data if violated (hardware/OS guarantee this)     |
| **ArrayList grow rule (JDK default)** | Grows by **1.5x** (`newCapacity = oldCapacity + oldCapacity >> 1`) when full                                                            | Some JVMs use 2x — always check the vendor's implementation |
| **Primitive vs object array**         | `int[]` holds raw values (4 bytes each). `Integer[]` holds **object references** (8 bytes each on 64-bit JVM) plus heap object overhead | Confusing these causes ~3x memory bloat                     |

⚠️ **Common misconception:** Many students assume `arr.length` is O(n). It is always **O(1)** — the JVM stores length as a field in the object header.

🔬 **Challenge — Memory Layout (near 5W1H):**

> Trace through a 10×10 `int` array's memory layout. What is the **byte offset** of element `arr[3][7]` in row-major order on a 64-bit JVM where `int` = 4 bytes?
>
> <details><summary>Answer</summary>
>
> **Step-by-step:**
>
> 1. Row-major formula: `offset = (row * numCols + col) * elementSize`
> 2. Substituting: `offset = (3 * 10 + 7) * 4 = (30 + 7) * 4 = 37 * 4 = 148 bytes`
> 3. If `arr` starts at address `0x1000`, then `arr[3][7]` lives at `0x1000 + 148 = 0x1094`.
>
> **Verification:** `arr[0][0]` = offset 0, `arr[0][9]` = offset 36, `arr[1][0]` = offset 40, `arr[3][7]` = 148. Each row is exactly 40 bytes (10 cols × 4 bytes). Row 3 starts at 120, plus 7 elements × 4 = 28 more = 148.
>
> **Follow-up:** For a `byte[10][10]`, `arr[3][7]` offset = `(3*10+7)*1 = 37 bytes`. For `double[10][10]` (8 bytes each), offset = `(3*10+7)*8 = 296 bytes`. Always multiply by `elementSize`!
>
> </details>

## 🧬 Nature & Behavior

### What is an Array?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Memory is a long tape of numbered boxes            │
│                                                    │
│ Address: 1000  1004  1008  1012  1016  1020        │
│          ┌────┬────┬────┬────┬────┬────┐           │
│          │ 10 │ 20 │ 30 │ 40 │ 50 │ 60 │           │
│          └────┴────┴────┴────┴────┴────┘           │
│          arr[0] arr[1] arr[2] arr[3] arr[4] arr[5] │
│                                                    │
│ CONTIGUOUS = Next to each other in memory          │
└────────────────────────────────────────────────────┘

WHY CONTIGUOUS MATTERS:
- arr[3] = baseAddress + (3 × elementSize)
- arr[3] = 1000 + (3 × 4) = 1012
- This is O(1) random access!
```

### Array Characteristics

| Property         | Value      | Why?                       |
| ---------------- | ---------- | -------------------------- |
| Access           | O(1)       | Direct address calculation |
| Search           | O(n)       | Must check each element    |
| Insert at end    | O(1)       | If space available         |
| Insert at middle | O(n)       | Must shift elements        |
| Delete           | O(n)       | Must shift elements        |
| Memory           | Contiguous | Fixed block needed         |

### 🧠 CPU Cache Locality — Why Arrays Are 10x Faster Than LinkedLists

```
THE HIDDEN PERFORMANCE SECRET:
═══════════════════════════════

Big-O says array access and linked list access are both O(n) for iteration.
But in practice, iterating an array is 10-100x FASTER. Why?

THE CPU MEMORY HIERARCHY:
┌─────────────┐ ← L1 Cache: 32KB, ~1 nanosecond (4 cycles)
├─────────────┤ ← L2 Cache: 256KB, ~4 nanoseconds (12 cycles)
├─────────────┤ ← L3 Cache: 8MB, ~12 nanoseconds (36 cycles)
├─────────────┤ ← RAM: 16GB, ~100 nanoseconds (300 cycles)
├─────────────┤ ← SSD: 1TB, ~100,000 nanoseconds
└─────────────┘ ← HDD: 2TB, ~10,000,000 nanoseconds

When CPU reads arr[0], it doesn't just fetch 4 bytes.
It fetches a CACHE LINE of 64 bytes (on most CPUs).
That's 16 ints in one fetch!

ARRAY ITERATION:
  arr[0]: CACHE MISS → fetch 64 bytes → arr[0..15] now in cache
  arr[1]: CACHE HIT!  (already in cache)
  arr[2]: CACHE HIT!  (already in cache)
  ...
  arr[15]: CACHE HIT! (already in cache)
  arr[16]: CACHE MISS → fetch next 64 bytes

  Result: Only 1 cache miss per 16 elements = 6.25% miss rate

LINKED LIST ITERATION:
  node1 at address 0x1000: CACHE MISS → fetch 64 bytes
  node2 at address 0x5F00: CACHE MISS → different region!
  node3 at address 0x2A00: CACHE MISS → different region!
  node4 at address 0x8100: CACHE MISS → different region!

  Result: Nearly 100% cache miss rate (nodes scattered in memory)

REAL NUMBERS (summing 1 million integers):
  Array:      ~0.5 ms  (cache-friendly sequential access)
  LinkedList: ~5.0 ms  (cache-hostile random access)
  That's 10x slower with the SAME Big-O complexity!

ANALOGY: Reading a book vs reading a dictionary.
  Array = reading pages sequentially (fast — pages are next to each other)
  LinkedList = following "see also" references that jump to random pages
  (slow — you keep flipping through the entire dictionary)
```

### 🔴 Real-World Origin: Supermarket Inventory (1957)

**Problem at IBM (1957):**

- Supermarket needed to track **10,000 products**
- Each product has: ID, Name, Price, Quantity
- Need to look up any product by ID **quickly**

**Before Arrays:**

- Products stored in random memory locations
- Finding product #5000 required searching 5000 locations
- Time: **O(n)** for every lookup 😩

**Solution — Array:**

- Store products in **consecutive memory**
- Product ID = Array Index
- `products[5000]` = **instant access!**

✅ **Result:** Lookup went from O(n) → **O(1)**, inventory checks became **1000x faster**, and this approach made modern retail possible!

## 💻 Implementation WITHOUT Collections

```java
public class MyArray {
    private int[] data;
    private int size;
    private int capacity;

    // Constructor
    public MyArray(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.size = 0;
    }

    // GET - O(1)
    public int get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        return data[index];
    }

    // SET - O(1)
    public void set(int index, int value) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        data[index] = value;
    }

    // ADD at end - O(1) amortized
    public void add(int value) {
        if (size == capacity) {
            resize();  // O(n) but rare
        }
        data[size++] = value;
    }

    // INSERT at index - O(n)
    public void insert(int index, int value) {
        if (size == capacity) {
            resize();
        }
        // Shift elements right
        for (int i = size; i > index; i--) {
            data[i] = data[i - 1];
        }
        data[index] = value;
        size++;
    }

    // DELETE at index - O(n)
    public int delete(int index) {
        int removed = data[index];
        // Shift elements left
        for (int i = index; i < size - 1; i++) {
            data[i] = data[i + 1];
        }
        size--;
        return removed;
    }

    // RESIZE - O(n)
    private void resize() {
        capacity *= 2;
        int[] newData = new int[capacity];
        for (int i = 0; i < size; i++) {
            newData[i] = data[i];
        }
        data = newData;
    }

    // SEARCH - O(n)
    public int search(int value) {
        for (int i = 0; i < size; i++) {
            if (data[i] == value) return i;
        }
        return -1;
    }

    // SIZE - O(1)
    public int size() {
        return size;
    }
}
```

---

## 🏋️ Part 3: Foundation Practice — Build Array Muscle Memory

💡 **Learning path:** Walk through these before touching patterns. They train loop instincts and set up every concept that follows.

### 📦 Group A — Traversal Basics

**Q1 — Declare & Print All Elements**

```java
int[] arr = {10, 20, 30, 40, 50};
for (int i = 0; i < arr.length; i++)
    System.out.print(arr[i] + " ");   // 10 20 30 40 50
```

**Q2 — Read From User**

```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
```

**Q3 — Print All EVEN Numbers** — O(n) _(already optimal — must check each element)_

```java
for (int x : arr) if (x % 2 == 0) System.out.print(x + " ");
```

❓ Why can't we do better than O(n)? Because we must inspect every element at least once.

**Q4 — Sum of Odd Numbers**

```java
int sum = 0;
for (int x : arr) if (x % 2 != 0) sum += x;
```

**Q5 — Average of All Elements**

```java
int sum = 0;
for (int x : arr) sum += x;
double avg = (double) sum / arr.length;
```

**Q6 — Average of Prime Numbers in Array**

```java
boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}
// In main:
int sum = 0, count = 0;
for (int x : arr) if (isPrime(x)) { sum += x; count++; }
double primeAvg = count > 0 ? (double)sum/count : 0;
```

💡 `i * i <= n` is the √n optimization — O(√n) instead of O(n) per check.

**Q7 — Print in Reverse Order** _(just print, don't rearrange)_

```java
for (int i = arr.length - 1; i >= 0; i--)
    System.out.print(arr[i] + " ");
// {11,34,67} → 67 34 11
```

**Q8 — Sum of First + Last Element**

```java
int result = arr[0] + arr[arr.length - 1];
```

**Q9 — Swap Every Two Adjacent Elements**

```
Input:  {8,7,5,1,5,2,6}
Output: {7,8,1,5,2,5,6}   ← pairs (0,1),(2,3),(4,5) swapped; last stays if odd length
```

```java
for (int i = 0; i + 1 < arr.length; i += 2) {
    int tmp = arr[i]; arr[i] = arr[i+1]; arr[i+1] = tmp;
}
```

**Q10 — Print Alternative Elements**

```java
for (int i = 0; i < arr.length; i += 2)
    System.out.print(arr[i] + " ");
```

**Q11 — Sum Up to Given Index K** _(prefix sum preview!)_

```java
int k = 3, sum = 0;
for (int i = 0; i <= k; i++) sum += arr[i];
```

💡 If you need this for many K values, computing each time = O(n) per query.
**Prefix Sum** (Part 13) makes it O(1) per query after O(n) build.

---

### 📦 Group B — Min / Max First Look

**Q12 — Find Biggest Element**

```java
int max = arr[0];
for (int x : arr) if (x > max) max = x;
// O(n) — optimal (must look at every element at least once)
```

**Q13 — Find Smallest Element**

```java
int min = arr[0];
for (int x : arr) if (x < min) min = x;
```

**Q14 — Find Second Highest Element**

```
Brute: Sort descending → arr[1]   O(n log n)
Better: Two-variable single pass   O(n)
```

```java
int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
for (int x : arr) {
    if (x > first)       { second = first; first = x; }
    else if (x > second) { second = x; }
}
```

**Q15 — Count Numbers Below Key Value**

```java
int key = 10, count = 0;
for (int x : arr) if (x < key) count++;
```

---

### 📦 Group C — Pairs & Two Arrays

**Q16 — All Pairs Summing to Target K** _(Two Sum brute force)_

```
Input: {4,6,18,10,14,2}, target=20 → Output: {6,14}, {18,2}
```

```java
// Brute: O(n²)
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (arr[i] + arr[j] == k)
            System.out.println("{" + arr[i] + "," + arr[j] + "}");
```

🧱 **You hit the wall** — for n=10⁶ this is 10¹² operations.
**HashMap reduces this to O(n)** — you'll apply that after learning HashMap (Part 10).

**Q17 — Sum of Same Position Values in Two Arrays**

```java
int[] a = {1,2,3}, b = {10,20,30};
for (int i = 0; i < a.length; i++)
    System.out.print((a[i] + b[i]) + " ");  // 11 22 33
```

**Q18 — Merge Two Arrays**

```java
int[] merged = new int[a.length + b.length];
for (int i = 0; i < a.length; i++) merged[i] = a[i];
for (int i = 0; i < b.length; i++) merged[a.length + i] = b[i];
```

---

### 🎯 Practice Problems — Foundation Level

| Problem                                | Platform   | Difficulty | Concept          |
| -------------------------------------- | ---------- | ---------- | ---------------- |
| LC 1929 — Concatenation of Array       | LeetCode   | ⭐ Easy    | Array building   |
| LC 2011 — Final Value After Operations | LeetCode   | ⭐ Easy    | Simple traversal |
| LC 1512 — Number of Good Pairs         | LeetCode   | ⭐ Easy    | Nested loops     |
| CF 4A — Watermelon                     | Codeforces | Div2-A     | Simple math      |
| CF 158A — Next Round                   | Codeforces | Div2-A     | Linear scan      |

🌟 **Goal:** Solve all 5 before moving to Sub Arrays. These cement loop instincts.

---

## 🎯 LeetCode Problems → Real-World Connection

### Problem: Two Sum

🏦 **Real-World Origin:** Financial Trading System (1990s)

**Problem at Goldman Sachs:**

- Traders needed to find **pairs of stocks** where Stock A + Stock B = Target budget
- Thousands of stocks, **milliseconds** to decide

**Before Optimization:**

```
for each stock A:
    for each stock B:
        if A + B == target: found!
```

Time: **O(n²)** — too slow for real-time trading!

**Solution — The Thinking Process:**

1. "We're checking the same pairs multiple times"
2. "What if we **remember** what we've seen?"
3. "**HashMap!** Store value → index"
4. "For each stock, check if the complement exists"

✅ **After:** O(n) time complexity → real-time trading possible. This **HashMap complement** pattern is now used in ALL trading systems.

---

## 🔲 Part 4: Sub Arrays — From Brute Force to Mastery

🎯 **This is where the most important array algorithms live. You'll hit walls that force you to learn Sliding Window, Two Pointers, and Prefix Sum.**

### 📖 Theory — What is a Sub Array?

```
Input: {1, 2, 3}
All sub-arrays:
  Length 1: {1}    {2}    {3}
  Length 2: {1,2}  {2,3}
  Length 3: {1,2,3}
  Total = n*(n+1)/2 = 3*4/2 = 6

KEY PROPERTIES:
  ✅ Contiguous  ← elements must be adjacent in original
  ✅ Order preserved
  ✅ Non-empty

SUBARRAY vs SUBSEQUENCE:
  {1,3} from {1,2,3} → ❌ NOT a sub-array  (2 is skipped)
  {1,3} from {1,2,3} → ✅ Valid subsequence (order kept, gaps allowed)
```

❓ **Quick Check:** How many sub-arrays in `{1,2,3,4,5}`?
→ 5×6/2 = **15**

---

### 🔵 Level 1: Enumerate All Sub Arrays

```java
// Time: O(n²) enumerate | O(n³) if printing each element
public void printAllSubArrays(int[] arr) {
    int n = arr.length;
    for (int start = 0; start < n; start++) {
        for (int end = start; end < n; end++) {
            for (int k = start; k <= end; k++)
                System.out.print(arr[k] + " ");
            System.out.println();
        }
    }
}
// Pattern to memorize: start→n, end→start..n → every window [start,end]
```

---

### 🧱 Level 2: You Hit the Wall — Max Sum Subarray

**Brute O(n³):** — TLE for n > 5,000

```java
int maxSum = arr[0];
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++) {
        int sum = 0;
        for (int k = i; k <= j; k++) sum += arr[k];  // ← 3rd loop = the bottleneck
        maxSum = Math.max(maxSum, sum);
    }
```

**Better O(n²):** Remove 3rd loop by accumulating

```java
int maxSum = arr[0];
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += arr[j];          // extend instead of recompute
        maxSum = Math.max(maxSum, sum);
    }
}
// Still O(n²) — TLE for n > 10⁵. Need something smarter.
```

---

### 🚀 GO LEARN — Techniques You Need

**STOP HERE — Learn these patterns, then return to "✅ Apply" below:**

| Technique          | When You Need It                        | Study File                                                                             |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------- |
| **Sliding Window** | Variable/fixed window on array          | 📖 [01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md)               |
| **Two Pointers**   | Sorted array, pairs/triplets            | 📖 [07_Two_Pointers_Complete.md](../04_Patterns_Templates/07_Two_Pointers_Complete.md) |
| **Prefix Sum**     | Sum queries, count subarrays with sum K | 📖 [04_Pattern_Recognition.md](../04_Patterns_Templates/04_Pattern_Recognition.md)     |

⬅️ **RETURN CHECKPOINT** — Come back here and apply each below.

---

### ✅ Apply 1: Maximum Subarray Sum — Kadane's Algorithm O(n)

```
KEY INSIGHT: At every index ask ONE question:
"Extend previous subarray  OR  start fresh from here?"
  currentMax = max(arr[i],  currentMax + arr[i])
```

```java
public int maxSubarraySum(int[] arr) {
    int maxSum = arr[0], current = arr[0];
    for (int i = 1; i < arr.length; i++) {
        current = Math.max(arr[i], current + arr[i]);    // extend or restart
        maxSum  = Math.max(maxSum, current);
    }
    return maxSum;
}
// Time: O(n) | Space: O(1)
```

**Dry Run — `[-2,1,-3,4,-1,2,1,-5,4]`:**

```
i  arr[i]  current                   maxSum
0   -2     -2                         -2
1    1     max(1,  -2+1) = 1           1
2   -3     max(-3,  1-3) = -2          1
3    4     max(4,  -2+4) = 4           4
4   -1     max(-1,  4-1) = 3           4
5    2     max(2,   3+2) = 5           5
6    1     max(1,   5+1) = 6           6  ← ANSWER
7   -5     max(-5,  6-5) = 1           6
8    4     max(4,   1+4) = 5           6
Answer: 6  (subarray [4,-1,2,1])
```

📖 **LeetCode 53** — Maximum Subarray

---

### ✅ Apply 2: Count Subarrays with Sum = K

**Brute O(n²):**

```java
int count = 0;
for (int i = 0; i < n; i++) {
    int sum = 0;
    for (int j = i; j < n; j++) {
        sum += arr[j];
        if (sum == k) count++;
    }
}
```

**Optimal O(n) — Prefix Sum + HashMap:**

```
INSIGHT: if prefixSum[j] - prefixSum[i] == k
         then subarray arr[i+1..j] has sum k
         Rearranged: prefixSum[i] = currentSum - k
         → For each position j, check if (currentSum - k) seen before in HashMap
```

```java
public int subarraySum(int[] arr, int k) {
    Map<Integer,Integer> freq = new HashMap<>();
    freq.put(0, 1);          // empty prefix has sum 0
    int count = 0, sum = 0;
    for (int x : arr) {
        sum += x;
        count += freq.getOrDefault(sum - k, 0);
        freq.merge(sum, 1, Integer::sum);
    }
    return count;
}
// Time: O(n) | Space: O(n)
```

🔗 **New to HashMap?** → 📖 [Go learn HashTable first](01e_HashTable.md) then return here.

📖 **LeetCode 560** — Subarray Sum Equals K

---

### ✅ Apply 3: Smallest Subarray with Sum ≥ K — Sliding Window O(n)

```java
public int minSubarrayLen(int k, int[] arr) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
    for (int right = 0; right < arr.length; right++) {
        sum += arr[right];                                   // expand right
        while (sum >= k) {                                   // shrink left
            minLen = Math.min(minLen, right - left + 1);
            sum -= arr[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
// Time: O(n) — each element enters/exits window once
```

📖 **LeetCode 209** — Minimum Size Subarray Sum

---

### ✅ Apply 4: Maximum Product Subarray O(n)

```
GOTCHA: Negative × Negative = Positive!
Track BOTH max and min at each step.
```

```java
public int maxProduct(int[] arr) {
    int maxProd = arr[0], curMax = arr[0], curMin = arr[0];
    for (int i = 1; i < arr.length; i++) {
        if (arr[i] < 0) { int t = curMax; curMax = curMin; curMin = t; }
        curMax  = Math.max(arr[i], curMax * arr[i]);
        curMin  = Math.min(arr[i], curMin * arr[i]);
        maxProd = Math.max(maxProd, curMax);
    }
    return maxProd;
}
```

📖 **LeetCode 152** — Maximum Product Subarray

---

### 🎯 Problem Set — Sub Arrays

| #   | Problem                            | Platform | Difficulty  | Key Technique        |
| --- | ---------------------------------- | -------- | ----------- | -------------------- |
| 1   | LC 53 — Maximum Subarray           | LeetCode | ⭐⭐ Med    | Kadane's             |
| 2   | LC 560 — Subarray Sum Equals K     | LeetCode | ⭐⭐ Med    | Prefix Sum + HashMap |
| 3   | LC 209 — Min Size Subarray Sum     | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 4   | LC 152 — Max Product Subarray      | LeetCode | ⭐⭐ Med    | Track max+min        |
| 5   | LC 1004 — Max Consecutive Ones III | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 6   | LC 713 — Subarray Product < K      | LeetCode | ⭐⭐ Med    | Sliding Window       |
| 7   | LC 76 — Minimum Window Substring   | LeetCode | ⭐⭐⭐ Hard | Sliding Window       |

### 🧠 Pattern Fingerprint — Sub Arrays

```
SEE THESE WORDS → USE THIS:
┌─────────────────────────────────────────────────────────┐
│ "contiguous" + "max/min sum"       → Kadane's O(n)     │
│ "subarray sum equals K"            → Prefix Sum + Map   │
│ "smallest/min window" + "sum ≥ K" → Sliding Window     │
│ "fixed window size K"              → Fixed S.Window     │
│ "all subarrays"                    → 2 nested loops     │
│ "product" instead of sum           → Track max + min    │
└─────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker

- **Day 3:** Redo LC 53 + LC 209 from memory (no hints)
- **Day 7:** Redo LC 560 (Prefix Sum + HashMap) + LC 713

---

## 🌿 Part 5: Sub Sequences — Order Without Contiguity

### 📖 Theory — What is a Sub Sequence?

```
Input: {1, 2, 3}
All subsequences (2ⁿ - 1 = 7):
  {1} {2} {3} {1,2} {1,3} {2,3} {1,2,3}

KEY: Order preserved, gaps ALLOWED.

COMPARISON:
  Subarray:    {2,3,4}  from {1,2,3,4,5}  ← contiguous slice
  Subsequence: {1,3,5}  from {1,2,3,4,5}  ← pick any, keep order
```

❓ **Quick Check:** How many subsequences in `{1,2,3,4}`?
→ 2⁴ - 1 = **15**

---

### 🔵 Level 1: The Include/Exclude Paradigm

```
For each element you have exactly 2 choices:
  ① INCLUDE it in current subsequence
  ② EXCLUDE it

Binary decision tree → 2ⁿ leaves

        {1,2,3}
           []
          /    \
      Incl 1   Excl 1
       [1]       []
      /   \     /   \
  [1,2] [1]  [2]   []
  ...
```

---

### 🚀 GO LEARN — Recursion (You Need This First)

**STOP** — Subsequence generation is built on recursion.

📖 [03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md)
📖 [03c_Recursion_Advanced.md — Subsets section](../03_Algorithms/03c_Recursion_Advanced.md)

⬅️ **RETURN CHECKPOINT** — Come back and apply below.

---

### ✅ Apply 1: Print All Subsequences — Recursion O(2ⁿ)

```java
public void subsequences(int[] arr, int index, List<Integer> current) {
    if (index == arr.length) {
        if (!current.isEmpty()) System.out.println(current);
        return;
    }
    current.add(arr[index]);           // INCLUDE
    subsequences(arr, index + 1, current);
    current.remove(current.size() - 1); // EXCLUDE (backtrack)
    subsequences(arr, index + 1, current);
}
// Call: subsequences(arr, 0, new ArrayList<>())
// Time: O(2ⁿ) — unavoidable (2ⁿ subsequences exist)
```

---

### ✅ Apply 2: Count Subsequences with Sum = K

```java
public int countSubseqSum(int[] arr, int index, int target) {
    if (target == 0) return 1;                        // found valid subsequence
    if (index == arr.length || target < 0) return 0;
    return countSubseqSum(arr, index + 1, target - arr[index])   // include
         + countSubseqSum(arr, index + 1, target);               // exclude
}
```

---

### ✅ Apply 3: Longest Increasing Subsequence (LIS)

```
Example: {10, 9, 2, 5, 3, 7, 101, 18}
LIS:     {2, 3, 7, 101}   length = 4
```

**Layer 1 — DP O(n²):**

```java
public int lisDP(int[] arr) {
    int n = arr.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);          // every element alone is LIS of length 1
    int max = 1;
    for (int i = 1; i < n; i++)
        for (int j = 0; j < i; j++)
            if (arr[j] < arr[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
                max   = Math.max(max, dp[i]);
            }
    return max;
}
```

**Layer 2 — Binary Search O(n log n):**

```java
public int lisOptimal(int[] arr) {
    List<Integer> tails = new ArrayList<>();
    for (int x : arr) {
        int pos = Collections.binarySearch(tails, x);
        if (pos < 0) pos = -(pos + 1);
        if (pos == tails.size()) tails.add(x);
        else tails.set(pos, x);
    }
    return tails.size();
}
// Uses Binary Search: 📖 06_Binary_Search_Patterns.md
```

❓ **Think:** Why does replacing with a smaller value work? Smaller tail = more room for future elements to extend the sequence.

---

### ✅ Apply 4: Longest Common Subsequence (LCS)

```java
public int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}
// Time: O(m*n) | Space: O(m*n)
// DP foundation: 📖 03_Algorithms/04b_DP_Fundamentals.md
```

---

### 🎯 Problem Set — Sub Sequences

| #   | Problem                             | Platform | Difficulty | Technique       |
| --- | ----------------------------------- | -------- | ---------- | --------------- |
| 1   | LC 78 — Subsets                     | LeetCode | ⭐⭐ Med   | Recursion       |
| 2   | LC 300 — LIS                        | LeetCode | ⭐⭐ Med   | DP → BinSearch  |
| 3   | LC 1143 — LCS                       | LeetCode | ⭐⭐ Med   | 2D DP           |
| 4   | LC 416 — Partition Equal Subset Sum | LeetCode | ⭐⭐ Med   | Subset-sum DP   |
| 5   | LC 1035 — Uncrossed Lines           | LeetCode | ⭐⭐ Med   | LCS in disguise |

### 🧠 Pattern Fingerprint — Sub Sequences

```
SEE THESE WORDS → USE THIS:
┌──────────────────────────────────────────────────────────┐
│ "all subsequences / subsets"          → Recursion 2ⁿ   │
│ "longest increasing subsequence"      → DP + BinSearch  │
│ "longest common subsequence"          → 2D DP            │
│ "not necessarily contiguous"          → SUBSEQUENCE!     │
│ "count subsequences with sum"         → Recursion / DP  │
└──────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker

- **Day 3:** Redo LC 78 (Subsets recursion) + LC 300 (LIS DP)
- **Day 7:** Redo LC 300 using binary search approach from memory

---

## 🔎 Part 6: Searching in Arrays

### Linear Search — O(n) | No sorted requirement

```java
public int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++)
        if (arr[i] == target) return i;
    return -1;
}
// Use when: unsorted, or searching only once
```

### Binary Search — O(log n) | Array MUST be sorted

```java
public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;    // avoids int overflow!
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
// For n=1,000,000: Linear = 1M checks. Binary = 20 checks!
```

📖 **GO DEEPER** — Binary Search has many variants (lower bound, answer space):
📖 [06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md)
⬅️ Return here after studying for: search in rotated array, first/last occurrence.

|                  | Linear Search          | Binary Search              |
| ---------------- | ---------------------- | -------------------------- |
| Requires sorted? | ❌ No                  | ✅ Yes                     |
| Time             | O(n)                   | O(log n)                   |
| Use when         | Unsorted / search once | Sorted / search many times |

### 🎯 Problems

| Problem                         | Pattern                |
| ------------------------------- | ---------------------- |
| LC 704 — Binary Search          | Classic                |
| LC 35 — Search Insert Position  | Lower bound            |
| LC 33 — Search in Rotated Array | Modified binary search |
| LC 34 — First and Last Position | Two binary searches    |

---

## 📈 Part 7: Sorting Algorithms — All 5

🔗 **Deep dive (Quick+Merge internals, TimSort, Dutch Flag):**
📖 [02a_Sorting_Fundamentals.md](../03_Algorithms/02a_Sorting_Fundamentals.md)

### 1. Bubble Sort — O(n²) avg, O(n) best with flag

```java
public void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
                swapped = true;
            }
        if (!swapped) break;    // already sorted → O(n) early exit
    }
}
```

### 2. Selection Sort — O(n²) always | Min swaps

```java
public void selectionSort(int[] arr) {
    for (int i = 0; i < arr.length - 1; i++) {
        int minIdx = i;
        for (int j = i+1; j < arr.length; j++)
            if (arr[j] < arr[minIdx]) minIdx = j;
        int tmp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = tmp;
    }
}
// Never more than n-1 swaps — good when writes are expensive
```

### 3. Insertion Sort — O(n) best (nearly sorted), O(n²) worst

```java
public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) { arr[j+1] = arr[j]; j--; }
        arr[j+1] = key;
    }
}
// BEST sort for small n or nearly-sorted input
```

### 4. Merge Sort — O(n log n) guaranteed, Stable, O(n) space

```java
public void mergeSort(int[] arr, int l, int r) {
    if (l >= r) return;
    int mid = l + (r - l) / 2;
    mergeSort(arr, l, mid);
    mergeSort(arr, mid+1, r);
    merge(arr, l, mid, r);
}
private void merge(int[] arr, int l, int mid, int r) {
    int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
    int i = 0, j = mid - l + 1, k = l;
    while (i <= mid-l && j <= r-l)
        arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
    while (i <= mid-l) arr[k++] = tmp[i++];
    while (j <= r-l)   arr[k++] = tmp[j++];
}
```

### 5. Quick Sort — O(n log n) avg, O(n²) worst, In-place

```java
public void quickSort(int[] arr, int low, int high) {
    if (low >= high) return;
    int p = partition(arr, low, high);
    quickSort(arr, low, p - 1);
    quickSort(arr, p + 1, high);
}
private int partition(int[] arr, int low, int high) {
    int pivot = arr[high], i = low - 1;
    for (int j = low; j < high; j++)
        if (arr[j] <= pivot) { i++; int t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    int t = arr[i+1]; arr[i+1] = arr[high]; arr[high] = t;
    return i + 1;
}
```

### Comparison Table

| Sort      | Best       | Avg        | Worst      | Space    | Stable | Best For               |
| --------- | ---------- | ---------- | ---------- | -------- | ------ | ---------------------- |
| Bubble    | O(n)       | O(n²)      | O(n²)      | O(1)     | ✅     | Teaching               |
| Selection | O(n²)      | O(n²)      | O(n²)      | O(1)     | ❌     | Min writes             |
| Insertion | **O(n)**   | O(n²)      | O(n²)      | O(1)     | ✅     | Small/nearly-sorted    |
| Merge     | O(n log n) | O(n log n) | O(n log n) | O(n)     | ✅     | Need stable guaranteed |
| Quick     | O(n log n) | O(n log n) | O(n²)      | O(log n) | ❌     | General in-place       |

### 🎯 Problems

| Problem                     | Sort Technique             |
| --------------------------- | -------------------------- |
| LC 912 — Sort an Array      | Implement merge/quick sort |
| LC 75 — Sort Colors         | Dutch National Flag        |
| LC 56 — Merge Intervals     | Sort by start, merge       |
| LC 1636 — Sort by Frequency | Custom comparator          |

---

## 🐛 Production Failure Modes & Debugging

> These are the bugs that kill arrays in production — not algorithm failures, but the silent killers: out-of-bounds, memory exhaustion, and cache collapse.

### Failure 1: ArrayIndexOutOfBoundsException in Production Loops

**Mechanism:** Three common causes in live code:

| Cause                       | Example                                                | Why It Happens                                            |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Off-by-one in termination   | `for (i=0; i<=arr.length; i++)`                        | `<=` instead of `<` — touches `arr[length]`               |
| Race in concurrent mutation | Thread A reads `length` while Thread B resizes         | `size` field drifts from `data.length`                    |
| Length/size confusion in 2D | `for (j=0; j<grid[0].length; j++)` when grid is jagged | Works in tests (uniform grids), fails on jagged real data |

**Debugging step — jstack investigation:**

```java
// Suspect: infinite loop or crash on specific input
// 1. Reproduce with: java -cp myapp.jar MyClass input.txt
// 2. Get live thread dump: jstack <pid> | grep -A 20 "RUNNABLE"
// 3. Look for: "java.lang.ArrayIndexOutOfBoundsException"
//    or stack frames stuck in your loop with no exit

// Safe pattern (no off-by-one):
for (int i = 0; i < arr.length; i++) { /* always safe */ }

// Safe 2D traversal (handles jagged):
for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)  // each row independently
        process(grid[r][c]);
```

### Failure 2: Memory Pressure from Large Array Allocation

**Mechanism:** Arrays allocate the full size upfront. A seemingly small declaration can OOM a container:

| Declaration                   | Size                        | 512MB JVM limit             |
| ----------------------------- | --------------------------- | --------------------------- |
| `new int[1_000_000]`          | ~4 MB                       | OK                          |
| `new int[100_000_000]`        | ~400 MB                     | OK                          |
| `new int[1_000_000_000]`      | **~4 GB**                   | OOM crash                   |
| `new int[100_000][100_000]`   | **~40 GB**                  | OOM on first line           |
| `new byte[Integer.MAX_VALUE]` | **2 GB** (max array length) | Legal but OOM on allocation |

**The 2D trap:** `int[100000][100000]` looks like 100k × 100k = 10 billion elements → ~40 GB. It fails at declaration, not at use.

**Debugging step — heap analysis:**

```java
// BEFORE allocation, validate:
long requiredBytes = (long) rows * cols * 4;  // 4 bytes per int
if (requiredBytes > Runtime.getRuntime().maxMemory()) {
    throw new IllegalArgumentException("Array too large: " + requiredBytes + " bytes");
}
int[][] arr = new int[rows][cols];  // now safe to proceed

// In production, monitor with:
// jcmd <pid> VM.native_memory summary
// jmap -heap <pid>  // shows used vs max heap
```

### Failure 3: Cache-Unfriendly Array Traversal Patterns

**Mechanism:** Cache lines are 64 bytes. Sequential access gives 1 miss per 16 `int` elements. Strided access can cause 1 miss per element — a **16x slowdown** disguised as algorithmic slowness:

| Pattern                                | Miss Rate                                | Relative Speed  |
| -------------------------------------- | ---------------------------------------- | --------------- |
| `for (int i=0; i<n; i++) arr[i]`       | 6.25% (1/16)                             | **1x baseline** |
| `for (int i=0; i<n; i+=2) arr[i]`      | 50% (1/2) — stride-2                     | ~8x slower      |
| `for (int i=0; i<n; i+=16) arr[i]`     | ~100% — stride-16                        | ~16x slower     |
| Column-major on `int[1000][1000]` flat | 100% — each row is a cache-line boundary | ~16x slower     |

**Real production symptom:** Matrix multiply with row-major layout and column-order inner loop runs 10-20x slower than expected from Big-O. CPU profilers (async-profiler, perf) show L1/L2 miss rate spikes.

**Debugging step — cache analysis:**

```java
// Symptom: code runs correctly but 10x slower than expected for size N
// 1. Use async-profiler to sample:
//    java -XX:+UnlockDiagnosticVMOptions \
//    -agentpath:async-profiler.so=start,event=cache-misses,interval=1ms
//
// 2. Or add instrumentation:
long start = System.nanoTime();
for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
        sum += matrix[r][c];  // row-major: cache-friendly
long end = System.nanoTime();
System.out.println("Row-major: " + (end - start) / 1e6 + " ms");

// For column-major access: transpose first, or flatten and access with:
// int idx = c * rows + r;   // map col-major to flat array
```

### Quick Reference: Failure Mode → Root Cause → Fix

| Failure                 | Root Cause                               | Fix                                                        |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| AIOOBE in loop          | `i <= length` or stale index             | Always use `i < arr.length`; validate index first          |
| OOM on array allocation | Size exceeds JVM heap                    | Check `requiredBytes > maxMemory` before allocation        |
| Slow but correct code   | Strided access destroying cache locality | Match traversal order to array layout; transpose if needed |

---

🔬 **Section Challenge — 📈 Part 7: Sorting Algorithms — All 5**

**Challenge 1 (Reasoning):** QuickSort average O(N log N) but worst case O(N²). When exactly does the worst case happen and how do you prevent it?

<details><summary>Answer</summary>

Worst case: pivot always ends up at position 0 or N-1 (completely unbalanced partition). This happens when: (1) always picking first/last element as pivot on already-sorted or reverse-sorted data. (2) Pivot happens to be the minimum or maximum. Prevention: random pivot (randomized quicksort — expected O(N log N) even on adversarial input), or median-of-three (pick median of first/middle/last element as pivot). Java's dual-pivot quicksort uses careful pivot selection to avoid this.

</details>

## 📊 Part 8: Frequency & Duplicates

### 🔵 Level 1: Brute — Nested Loops O(n²)

```java
// Count how many times each element appears — O(n²)
for (int i = 0; i < n; i++) {
    int freq = 0;
    for (int j = 0; j < n; j++)
        if (arr[j] == arr[i]) freq++;
    System.out.println(arr[i] + " appears " + freq + " times");
}
// Problem: counts same element multiple times, and O(n²) is too slow for large n
```

### 🧱 Hit the Wall — Need O(n) Lookup by Value

Finding most repeated, least repeated, duplicates: all O(n²) with nested loops.

---

### 🚀 GO LEARN — HashMap

**STOP** — The O(n) solution for ALL frequency problems uses HashMap.

📖 [01e_HashTable.md](01e_HashTable.md)
Focus on: `put`, `get`, `getOrDefault`, `containsKey`, `merge`, `entrySet`

⬅️ **RETURN CHECKPOINT** — Apply HashMap below.

---

### ✅ Apply: Frequency using HashMap O(n)

```java
// Build frequency map — O(n)
Map<Integer,Integer> freq = new HashMap<>();
for (int x : arr) freq.merge(x, 1, Integer::sum);   // freq[x]++

// Most repeated element
int maxFreq = 0, mostRepeated = -1;
for (var e : freq.entrySet())
    if (e.getValue() > maxFreq) { maxFreq = e.getValue(); mostRepeated = e.getKey(); }

// Count unique elements
int uniques = freq.size();

// Count elements appearing more than once
long dups = freq.values().stream().filter(v -> v > 1).count();
```

### ✅ Loop Patterns for Frequency

```java
// Include right loop (expand from left — cumulative)
for (int right = 0; right < n; right++) { /* process arr[right] */ }

// Include both (shrink/grow window)
for (int left = 0, right = 0; right < n; right++) {
    // add arr[right] to window
    while (/* condition violated */) { /* remove arr[left] */ left++; }
}
```

### ✅ Common Elements in Two Arrays — HashSet O(n+m)

```java
Set<Integer> setA = new HashSet<>();
for (int x : a) setA.add(x);
for (int x : b) if (setA.contains(x)) System.out.print(x + " ");
// vs brute: O(n*m) nested loops
```

### ✅ LCM / GCD of Array Elements

```java
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
int lcm(int a, int b) { return a / gcd(a,b) * b; }   // a/gcd first avoids overflow

// GCD of entire array
int arrGcd = arr[0];
for (int i = 1; i < n; i++) arrGcd = gcd(arrGcd, arr[i]);

// LCM of entire array
long arrLcm = arr[0];
for (int i = 1; i < n; i++) arrLcm = lcm((int)arrLcm, arr[i]);

// LCM of only odd numbers
long oddLcm = 1;
for (int x : arr) if (x % 2 != 0) oddLcm = lcm((int)oddLcm, x);
```

### 🎯 Problems

| Problem                               | Pattern                   |
| ------------------------------------- | ------------------------- |
| LC 1 — Two Sum                        | HashMap complement lookup |
| LC 242 — Valid Anagram                | Frequency count           |
| LC 347 — Top K Frequent Elements      | Freq + Heap               |
| LC 128 — Longest Consecutive Sequence | HashSet O(n)              |
| CF 4C — Registration System           | HashMap counting          |

### 🧠 Pattern Fingerprint — Frequency

```
SEE THESE WORDS → USE THIS:
┌──────────────────────────────────────────────────────────┐
│ "most/least frequent"            → HashMap + track max  │
│ "count occurrences"              → HashMap freq          │
│ "find duplicate"                 → HashSet or sorting    │
│ "common elements two arrays"     → HashSet O(n+m)       │
│ "O(1) lookup by value"           → HashMap               │
└──────────────────────────────────────────────────────────┘
```

### 📅 Revisit Tracker

- **Day 3:** Redo LC 1 (Two Sum) + LC 242 (Anagram)
- **Day 7:** Redo LC 128 (Consecutive — HashSet O(n))

---

## 🔄 Part 9: Circular Arrays & Rotations

### Theory — What is a Circular Array?

```
A circular array wraps: index (n-1)+1 → loops back to 0
Input: {1,2,3}
All rotations:
  {1,2,3}  (rotate by 0)
  {2,3,1}  (rotate left by 1)
  {3,1,2}  (rotate left by 2)
Key: use (i + rotate) % n  to access circularly
```

### Print All Circular Rotations O(n²)

```java
public void printRotations(int[] arr) {
    int n = arr.length;
    for (int r = 0; r < n; r++) {
        for (int i = 0; i < n; i++)
            System.out.print(arr[(r + i) % n] + " ");   // modulo is the trick
        System.out.println();
    }
}
```

### Rotate Array Left by K — Reverse Trick O(n) time O(1) space

```java
public void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    k = k % n;                         // handle k > n
    reverse(arr, 0, k - 1);           // reverse first k
    reverse(arr, k, n - 1);           // reverse rest
    reverse(arr, 0, n - 1);           // reverse all
}
private void reverse(int[] arr, int l, int r) {
    while (l < r) { int t=arr[l]; arr[l]=arr[r]; arr[r]=t; l++; r--; }
}
// {1,2,3,4,5}, k=2 → {3,4,5,1,2}
```

### 🎯 Problems

| Problem                              | Pattern                   |
| ------------------------------------ | ------------------------- |
| LC 189 — Rotate Array                | Reverse trick             |
| LC 153 — Min in Rotated Sorted Array | Binary search             |
| LC 918 — Max Sum Circular Subarray   | Kadane's + circular trick |

---

## 🌀 Part 10: Recursion in Arrays

📖 **GO LEARN Recursion fundamentals first if new:**
📖 [03b_Recursion_Fundamentals.md](../03_Algorithms/03b_Recursion_Fundamentals.md)
⬅️ Return here to apply it to arrays.

### Recursive Sum

```java
public int sum(int[] arr, int n) {
    if (n == 0) return 0;                         // base case
    return arr[n-1] + sum(arr, n-1);             // reduce and recurse
}
// T(n) = T(n-1) + O(1)  →  O(n) time, O(n) space (stack frames)
```

### Recursive Binary Search

```java
public int binarySearch(int[] arr, int l, int r, int target) {
    if (l > r) return -1;
    int mid = l + (r - l) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) return binarySearch(arr, mid+1, r, target);
    return binarySearch(arr, l, mid-1, target);
}
// T(n) = T(n/2) + O(1)  →  O(log n)
```

### Recursive Reverse

```java
public void reverse(int[] arr, int left, int right) {
    if (left >= right) return;
    int tmp = arr[left]; arr[left] = arr[right]; arr[right] = tmp;
    reverse(arr, left+1, right-1);
}
```

🧠 **Key insight:** Recursion on arrays is often the brute force for subsequences and subsets. DP is the optimization: recursion + memoization.

---

🔬 **Section Challenge — 🌀 Part 10: Recursion in Arrays**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?

<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.

</details>

**Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```

Why and what are the 3 fixes?

<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.

</details>

## ⚡ Part 11: Pattern Connections Hub

**Master map:** Array problem type → Pattern → DS needed → Where to learn

| Problem Type         | Pattern                         | DS Used       | Study File                                                                         | Example      |
| -------------------- | ------------------------------- | ------------- | ---------------------------------------------------------------------------------- | ------------ |
| Max/min subarray sum | **Kadane's**                    | Variables     | [04_Pattern_Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md)       | LC 53        |
| Subarray sum = K     | **Prefix Sum + HashMap**        | HashMap       | [04_Pattern_Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md)       | LC 560       |
| Min window subarray  | **Sliding Window**              | Two ptrs      | [01_Sliding_Window](../04_Patterns_Templates/01_Sliding_Window.md)                 | LC 209, 76   |
| Pairs with sum K     | **Two Pointers** or **HashMap** | Array/Map     | [07_Two_Pointers](../04_Patterns_Templates/07_Two_Pointers_Complete.md)            | LC 1, 167    |
| All subsequences     | **Recursion / Backtracking**    | Call stack    | [03c_Recursion_Advanced](../03_Algorithms/03c_Recursion_Advanced.md)               | LC 78        |
| LIS / LCS            | **DP**                          | 1D/2D array   | [04b_DP_Fundamentals](../03_Algorithms/04b_DP_Fundamentals.md)                     | LC 300, 1143 |
| Frequency / count    | **HashMap**                     | HashMap       | [01e_HashTable](01e_HashTable.md)                                                  | LC 1, 347    |
| Find in sorted       | **Binary Search**               | Two ptrs      | [06_Binary_Search_Patterns](../04_Patterns_Templates/06_Binary_Search_Patterns.md) | LC 704, 33   |
| k-th largest         | **Heap / QuickSelect**          | PriorityQueue | [01f_Trees_Heaps](01f_Trees_Heaps.md)                                              | LC 215       |
| 3 groups (0,1,2)     | **Dutch National Flag**         | Two ptrs      | [02a_Sorting](../03_Algorithms/02a_Sorting_Fundamentals.md)                        | LC 75        |

### 🧠 Master Keyword → Pattern Map

```
"contiguous" + "sum/max/min"      → Sliding Window or Kadane's
"subarray" + "sum equals K"       → Prefix Sum + HashMap
"subsequence"                     → Recursion or DP
"pairs/triplets" + "sum"          → Two Pointers (sort first) or HashMap
"sorted" + "search"               → Binary Search
"frequency" / "count"             → HashMap
"rotate" / "circular"             → Modulo arithmetic  (i+k)%n
"k-th largest/smallest"           → Min-Heap of size k
"all possible" / "generate all"   → Recursion / Backtracking
"minimum/maximum" + "global"      → Greedy or DP
```

---

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                          | Related Content                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Array patterns & templates     | [Array + Two Pointers](../04_Patterns_Templates/08_Array_Plus_TwoPointers.md)   |
| Array practice problems        | [Problem Solving — Arrays](../05_Problem_Solving/04_Arrays.md)                  |
| Sorting algorithms on arrays   | [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md)            |
| Sliding window on arrays       | [Sliding Window Mastery](../04_Patterns_Templates/01_Sliding_Window.md)         |
| Binary search on sorted arrays | [Binary Search Patterns](../04_Patterns_Templates/06_Binary_Search_Patterns.md) |
| 2D arrays / Matrix             | [2D Arrays & Matrix](04_2D_Arrays_Matrix.md)                                    |
| NumPy arrays (Python)          | [NumPy & Pandas](../25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md)          |

---

---

## ✅ You Know Arrays — Now Practice! (JIT Study Path)

**Follow this exact order. Don't skip steps.**

**Step 1 — Basic Problems (Warm Up):**

| Problem                     | LC #   | Pattern         | What to Learn                    |
| --------------------------- | ------ | --------------- | -------------------------------- |
| Two Sum                     | LC 1   | HashMap lookup  | O(n²) → O(n) with complement map |
| Best Time to Buy/Sell Stock | LC 121 | Min-so-far scan | Single pass tracking             |
| Contains Duplicate          | LC 217 | HashSet         | O(n) existence check             |
| Missing Number              | LC 268 | Math / XOR      | n\*(n+1)/2 or XOR trick          |
| Maximum Subarray            | LC 53  | Kadane's algo   | dp[i] = max(num, dp[i-1]+num)    |

**Step 2 — Hit a wall? Learn these patterns:**

- Contiguous subarray → **[Sliding Window Template](../04_Patterns_Templates/01_Sliding_Window.md)**
- In-place operations → **[Two Pointers Template](../04_Patterns_Templates/07_Two_Pointers_Complete.md)**
- "Sum equals K" → **[Prefix Sum Guide](../03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)**

**Step 3 — Apply patterns on harder problems:**
👉 **[Go to Arrays Problem Solving File →](../05_Problem_Solving/04_Arrays.md)**

**Step 4 — Competitive Practice:**

| CF Problem                                                                        | Topic              | Difficulty  |
| --------------------------------------------------------------------------------- | ------------------ | ----------- |
| [CF 1A — Theatre Square](https://codeforces.com/problemset/problem/1/A)           | Math on arrays     | ⭐ Easy     |
| [CF 158B — Taxi](https://codeforces.com/problemset/problem/158/B)                 | Array grouping     | ⭐ Easy     |
| [CF 1515C — Phoenix and Towers](https://codeforces.com/problemset/problem/1515/C) | Array construction | ⭐⭐ Medium |

🌍 **Real-World Connections:**

- **Netflix** stores your watch history as an array, uses sliding window to compute "trending in last 7 days"
- **Stock price APIs** return arrays; max profit = max(price[i] - min(price[0..i-1]))
- **Sensor data** (IoT, medical devices) uses circular arrays / ring buffers
- **Git diff** (add/remove lines) uses LCS algorithm on arrays of lines

---

# 🎓 University-Level Addendum — Arrays as Formal Theory

> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. It assumes you have read the body above; the content here formalizes the intuition behind array algorithms with proofs, constraint enumeration, and explicit failure modes. Cross-references to `01a_Memory_Foundations.md` for the underlying memory layout theory.

## Array Constraint Signals — Read These First

Before choosing an array algorithm, read these constraint signals from the problem statement. They determine whether the array is the right DS and which algorithm family applies.

| Signal | What It Tells You | Example |
|---|---|---|
| **`n ≤ 10³`** | Brute force O(n²) is fine; choose simplest algorithm | Sorting + nested loop |
| **`n ≤ 10⁵`** | O(n log n) needed; merge sort, heap, balanced BST | Kadane's, sliding window |
| **`n ≤ 10⁶`** | O(n) required; single pass, two pointers, prefix sums | Sub-array sum |
| **`n ≥ 10⁷`** | Memory becomes the bottleneck; O(1) extra space mandatory | Streaming problems |
| **Random access required** | Array beats linked list (O(1) vs O(n)) | Direct index lookup |
| **Insert/delete in middle** | Linked list may beat array (O(1) vs O(n)) | Frequent edits |
| **Memory budget < 4 × n × sizeof(T)** | Compact array / bitset | Boolean grid |
| **Array sorted** | Binary search O(log n), two pointers O(n) | Search in sorted |
| **Array unsorted** | Hash-based O(n) or sort-then-search O(n log n) | Two-sum |
| **2D array** | Cache-friendly traversal order matters (row-major) | Matrix problems |

These are the same constraint signals at the heart of `02_PROBLEM_SETS.md` Model 1. Master them once and the algorithm choice becomes mechanical.

### Worked Example — Picking Algorithm from Constraints

**Problem:** Find the maximum sum of any contiguous subarray.

- n = 10⁵, time budget = 1 second, memory budget = O(1)
- **Reading constraints:** n ≤ 10⁵ → O(n log n) or O(n) needed; O(n²) (brute force) is too slow.
- **Brute force:** Try all O(n²) subarrays, sum each → O(n³) → ~10¹⁵ ops → 1,000 seconds. Fails.
- **Optimized:** Kadane's algorithm → O(n) single pass → ~10⁵ ops → 0.0001 seconds. Passes.
- **DS choice:** Contiguous array (the input itself); no auxiliary DS needed. ✅

## When Arrays Break — Formal Failure Modes

An array's invariants (contiguity, random access, bounded size) can be violated. The following are the canonical "when arrays break" scenarios that every algorithm must defend against.

### Break 1 — Out-of-Bounds Access

**Condition:** Index `i` is negative, ≥ length, or computed from another index that overflowed.

**What breaks:** `ArrayIndexOutOfBoundsException` in Java; undefined behavior in C/C++; silent corruption in Fortran if the array is on the stack and the out-of-bounds location is reused.

**Invariant violated:** `0 ≤ i < arr.length` for every access. Algorithms that compute indices (e.g., `i = left + (right - left) / 2` for binary search) must prove the index stays in bounds for the entire loop.

**Defense:** Test boundary cases (`i = 0`, `i = length - 1`, `i = length`) explicitly. Use checked arithmetic for index computation.

### Break 2 — Resize Cost Amortization Failure

**Condition:** An algorithm repeatedly appends to an array that needs to grow. If growth is not geometric (e.g., `+1` per resize), the total cost is O(n²), not O(n).

**What breaks:** A `n = 10⁶` append becomes 10¹² ops → 1,000 seconds instead of 1 second. The `ArrayList` in Java uses 1.5× growth; `Vector` (legacy) uses 2×; both are correct, but a custom implementation that grows by `+1` is broken.

**Invariant violated:** Amortized O(1) per append requires geometric growth. The proof (geometric series, sum ≤ 2n) is in `01g_DS_Internals.md` Challenge 1.

**Defense:** Always check the growth factor. Linear growth is a bug.

### Break 3 — Cache-Line Trashing on Column-Major Traversal

**Condition:** 2D array iterated in column-major order when stored in row-major memory (the C/Java/Fortran default).

**What breaks:** Every access misses the cache line. For an N×M matrix, total cache misses are M×N instead of N + M/16. See `01a_Memory_Foundations.md` Challenge 3 for the 1,000× slowdown demonstration.

**Invariant violated:** Spatial locality: consecutive memory accesses should be within the same cache line (64 bytes = 16 `int`s). Column-major access in row-major memory breaks this.

**Defense:** Use row-major order in row-major memory. For column-major data (e.g., from a Fortran library), transpose first or use blocked algorithms.

### Break 4 — Memory Fragmentation with Variable-Length Rows

**Condition:** Java `int[][]` is an array of references to inner arrays. Each inner array is a separate heap allocation. If inner rows are allocated with different sizes (jagged array), fragmentation occurs.

**What breaks:** Outer array fits in cache; inner arrays scatter across the heap. Iteration in row-major order pays one cache miss per row on average instead of amortizing across the row.

**Invariant violated:** A 2D array stored row-major must have contiguous rows. Ragged arrays break this invariant.

**Defense:** Use a 1D array with manual indexing (`arr[row * cols + col]`) when memory locality matters.

### Break 5 — Integer Overflow on Size Computation

**Condition:** Computing `n * sizeof(T)` or `2 * size` where the result exceeds `Integer.MAX_VALUE`.

**What breaks:** Negative array length → `NegativeArraySizeException`; wrong size allocated → OOB write on first element.

**Invariant violated:** Array size must be a non-negative integer. The OS allocates memory in pages, so the size must also be representable as `size_t` (typically 64-bit).

**Defense:** Use `long` for size arithmetic. Allocate via `Math.toIntExact(longValue)` to detect overflow explicitly.

### Break 6 — Aliasing in In-Place Algorithms

**Condition:** In-place reversal, rotation, or partition algorithms that use two pointers moving toward each other. If the two pointers reference overlapping memory (e.g., the same subarray), the swap corrupts data.

**What breaks:** In-place reversal of a palindrome (`[1, 2, 1]` → swap(0, 2) gives `[1, 2, 1]`, then swap(1, 1) is a no-op — works). But for an even-length palindrome (`[1, 2, 2, 1]` → swap(0, 3) gives `[1, 2, 2, 1]`, then swap(1, 2) gives `[1, 2, 2, 1]`, then loop terminates — works). The bug surfaces with `arr == reverseInPlace(arr)` when `arr.length == 1`.

**Invariant violated:** `i < j` for the entire loop. When `i == j`, the algorithm must terminate.

**Defense:** Use `while (i < j)` (strict), not `while (i <= j)`.

## Brute-Force to Optimal Ladder — Array Problems

The canonical ladder for array problems, with explicit cost progression:

| Tier | Approach | Cost | When Acceptable |
|---|---|---|---|
| **L0 — All subarrays** | Enumerate every O(n²) subarray, check each | O(n³) total | n ≤ 500 |
| **L1 — All subarrays, summed incrementally** | Enumerate subarrays, sum on the fly | O(n²) | n ≤ 5,000 |
| **L2 — Prefix sums** | Precompute prefix array, answer each query in O(1) | O(n) preprocess + O(1) query | n ≤ 10⁵ |
| **L3 — Single pass** | Maintain running state (Kadane's, two pointers) | O(n) | n ≤ 10⁶ |
| **L4 — Streaming** | O(1) memory, O(n) time, single pass with limited lookback | O(n) | n ≥ 10⁷ |

The ladder is the array-specific counterpart to the memory-cost ladder in `01a_Memory_Foundations.md`. Pick the lowest tier that meets the time budget.

### Worked Example — Maximum Subarray Sum

**Input:** `arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`, n = 9.

- **L0 — All subarrays:** O(n³) → enumerate all 36 subarrays, sum each. Result: 6 (`[4, -1, 2, 1]`).
- **L1 — Prefix sums:** O(n²) → compute prefix sums, enumerate subarrays. Result: 6.
- **L2 — Prefix + max query:** O(n) preprocess → prefix[i] - prefix[j] = subarray sum. Result: 6.
- **L3 — Kadane's:** O(n) single pass → track running max, reset on negative. Result: 6.
- **L4 — Streaming:** Same as L3, but with bounded lookback window.

For n = 10⁵, only L2, L3, L4 complete in time. L3 (Kadane's) is the standard answer; L4 is the engineering choice if memory is bounded.

## Edge Cases — Always Check These

Every array algorithm must enumerate these in its correctness argument. Skipping one is a common source of bugs.

| # | Edge Case | What Can Break |
|---|---|---|
| 1 | **Empty array** (`n = 0`) | Off-by-one in size; loop never enters; max/min returns sentinel (Java: `Optional.empty()`) |
| 2 | **Single element** (`n = 1`) | Trivial case hides init bugs; max = min = arr[0] |
| 3 | **All same elements** (`arr = [5, 5, 5, 5]`) | Binary search assumes strict ordering; returns wrong index |
| 4 | **Sorted ascending** | BST degeneracy if used; binary search works |
| 5 | **Sorted descending** | Mirror of #4 |
| 6 | **Negative numbers only** | Max-product algorithms break if they assume ≥ 0 |
| 7 | **Mixed positive/negative** | Kadane's invariant: reset running sum when negative |
| 8 | **Integer overflow in sum** | `n * MAX_VALUE` exceeds `int`; use `long` |
| 9 | **Duplicate max/min values** | First/last occurrence semantics differ (stable vs unstable) |
| 10 | **NaN in floating-point arrays** | All comparisons with NaN return false; max/min returns first non-NaN |

## Formal Complexity Proofs — Array Operations

These derivations make the Big-O statements throughout the chapter precise.

### Random Access

For `arr[i]`:

```
T_random_access(arr, i) = T_base + sizeof(T) * i / cache_line_size * T_RAM
                         + sizeof(T) * (i mod 16) * T_L1
                         ≈ T_L1 for i in same cache line as previous access
                         ≈ T_RAM for cold random access (uniform i)
```

**Average case (uniform random i over N elements):**

```
E[T] = (N / 16) * T_RAM + (1 - N/16) * T_L1
     ≈ T_L1 + (N / 16) * (T_RAM - T_L1)
```

For N = 10⁶ with T_L1 = 1 ns and T_RAM = 100 ns, E[T] ≈ 1 + 62,500 × 99 ≈ 6.2 μs per access.

### Sequential Traversal

For `arr[0..n-1]` in order:

```
T_sequential(n) = n * T_L1     (after first cold miss brings cache line)
                ≈ n * 1 ns      = 1 ms for n = 10⁶
```

vs random access: 6.2 μs × 10⁶ = 6.2 seconds. Sequential is 6,000× faster — this is why `for (i = 0; i < n; i++) sum += arr[i]` outperforms `while (true) { int i = rand() % n; sum += arr[i]; }` by orders of magnitude.

### Prefix Sum Precompute

```
T_prefix_precompute(n) = O(n) additions
T_prefix_query(l, r)   = O(1) — one subtraction
T_total(q queries)     = O(n + q)
```

This is the L2 tier in the brute-force ladder; the win is amortizing precompute over many queries.

### Resize Cost (Geometric Growth)

For `ArrayList`-style 1.5× growth:

```
T_resize_amortized(n) = O(1) per append
                       because sum(1 + 1/1.5 + 1/1.5² + ... + 1/1.5^k) = 1/(1 - 1/1.5) = 3
```

The geometric series proof: each element is copied at most `log_{1.5}(n)` times, so total copies ≤ `n * log_{1.5}(n)` / `n` = `log_{1.5}(n)` ≈ 32 for n = 10⁶. Amortized O(1) per append.

For linear growth (`+1` per resize), the same proof gives `O(n)` per append — quadratic total. **Always use geometric growth.**

## Cross-References

- **`01a_Memory_Foundations.md`** — memory layout invariants, cache-line analysis, and the brute-force memory cost ladder.
- **`01c_LinkedList.md`** — the alternative to arrays when insert/delete at arbitrary position dominates; pointer-chasing cost analysis.
- **`01g_DS_Internals.md`** — ArrayList resize proof (geometric series), escape analysis for primitive arrays.
- **`02_PROBLEM_SETS.md`** — exam-style problems on arrays (Kadane's invariant, address-formula derivation, rotation proof).
- **`A2_DS_Complexity_FirstPrinciples.md`** — formal Big-O derivations for all array operations.
- **`A3_DS_Lower_Bounds.md`** — proves Ω(n log n) lower bound on comparison-based array sorting.

---

## 💥 When Arrays Break

> Every one of these has caused a real production bug. Know the failure mode before you need to debug it.

### 1. Integer Overflow in Binary Search Mid Calculation
**What breaks**: `int mid = (lo + hi) / 2` overflows when `lo + hi > Integer.MAX_VALUE` (≈ 2.1 billion). The sum wraps to a negative number → mid is negative → `ArrayIndexOutOfBoundsException`.
**History**: This bug lived in textbooks since 1946 and was in Java's `Arrays.binarySearch()` from 1997 until Joshua Bloch reported it at Google in 2006.
**Fix**: `int mid = lo + (hi - lo) / 2;` — equivalent result, no overflow.
**Production scope**: Any binary search on an array of size > 1 billion elements (common in distributed sorted datasets).

📎 **Reference Anchor**: [OpenJDK Arrays.binarySearch()](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/Arrays.java)
**Invariant learned**: The invariant `lo ≤ target_index ≤ hi` must hold at every step. The correct mid formula preserves this by staying within the [lo, hi] range even at Integer boundary values.

### 2. Off-By-One in Two-Pointer Shrink Condition
**What breaks**: Using `<` instead of `<=` (or vice versa) in sliding-window or two-pointer shrink condition. Classic example in longest substring without repeating characters:
```java
// BUG — uses < instead of >:
while (charCount.get(s.charAt(right)) < 1) { // should be > 1
    charCount.merge(s.charAt(left++), -1, Integer::sum);
}
```
**Root cause**: The shrink condition decides when the window is invalid. Getting `<` vs `>` backwards admits invalid windows silently — no exception, just wrong answers.
**Fix**: Write the invariant explicitly first: "the window is valid when all char counts ≤ 1." Shrink when any count > 1.

### 3. 2D Array Row-Major vs Column-Major Access Pattern
**What breaks**: Iterating a 2D array in the wrong order causes cache misses on every element.
```java
// SLOW — column-major access on a row-major array:
for (int col = 0; col < N; col++)
    for (int row = 0; row < N; row++)
        sum += matrix[row][col];  // jumps N elements between accesses

// FAST — row-major access:
for (int row = 0; row < N; row++)
    for (int col = 0; col < N; col++)
        sum += matrix[row][col];  // sequential in memory
```
**Impact**: For a 1000×1000 `int[][]`, the slow version can be 5–10× slower due to cache misses. Java 2D arrays are arrays of references to row arrays (row-major), so row-sequential access is always cache-friendly.

### 4. Sorting Parallel Arrays Destroys Correlation
**What breaks**: When two arrays represent related data (e.g., `names[]` and `scores[]`), sorting one array by value breaks the index correspondence with the other.
```java
Arrays.sort(scores);  // now scores[0] is the lowest score,
                      // but names[0] is still the original first person
                      // → correlation destroyed
```
**Fix**: Use an array of objects (`record Person(String name, int score)`) or sort indices instead: `Integer[] idx = ...; Arrays.sort(idx, (a,b) -> scores[a] - scores[b]);`

### 5. `Arrays.asList()` Returns a Fixed-Size List
**What breaks**: `Arrays.asList(1, 2, 3)` returns a fixed-size list backed by the array. Calling `.add()` or `.remove()` throws `UnsupportedOperationException`.
**Root cause**: `Arrays.asList()` returns `Arrays.ArrayList` — not `java.util.ArrayList`. It wraps the array without copying.
**Fix**: `new ArrayList<>(Arrays.asList(...))` creates a mutable copy. Or `List.of(...)` (Java 9+) for an immutable list with a clearer contract.

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Correctness — 8 min)**: State the loop invariant for standard binary search and use it to prove the algorithm is correct and terminates.

<details><summary>Model Answer</summary>

**Invariant**: At the start of each iteration, if `target` exists in the array, it is in `arr[lo..hi]`.

- **Init**: `lo=0, hi=n-1` — the entire array. If target exists, it's here. ✓
- **Maintenance**: We compute `mid = lo + (hi-lo)/2`. If `arr[mid] == target` → return mid. If `arr[mid] < target` → target can only be in `arr[mid+1..hi]`, so `lo = mid+1`. If `arr[mid] > target` → target can only be in `arr[lo..mid-1]`, so `hi = mid-1`. In each case, the invariant holds for the new range. ✓
- **Termination**: Each iteration reduces `hi - lo` by at least 1 (since `mid` is strictly between lo and hi when `hi > lo`). When `lo > hi`, the range is empty → target is not present, return -1. ✓

</details>

---

**Problem 2 (Analysis — 5 min)**: Prove that a dynamic array with geometric growth factor r > 1 achieves O(1) amortised append.

<details><summary>Model Answer</summary>

**Potential function**: Φ = 2 × (current size) − capacity.

When the array is at size k with capacity k (full):
- Actual cost of append with resize: copy k elements + insert 1 = k+1.
- New capacity = r×k; new Φ = 2(k+1) − rk.
- Old Φ = 2k − k = k.
- Amortised = (k+1) + (2(k+1) − rk) − k = 3 + (2−r)k.
- For r=2: amortised = 3 − 0 = 3 = **O(1)**. ✓

When append does NOT trigger resize (normal case): actual cost = 1; Φ increases by 2; amortised = 3. ✓

</details>

---

**Problem 3 (Reasoning — 5 min)**: An array contains n distinct integers. Describe an O(n) algorithm to find the single missing integer in range [1, n+1] without using extra space.

<details><summary>Model Answer</summary>

**Key insight**: Sum of integers 1 to (n+1) = (n+1)(n+2)/2. The actual sum of the array is some value S. The missing integer = (n+1)(n+2)/2 − S.

```java
int missing = (n+1)*(n+2)/2;
for (int x : arr) missing -= x;
return missing;
```

**Complexity**: O(n) time, O(1) extra space. No sorting, no hash set needed.

**Overflow note**: For large n, use `long` arithmetic. `(long)(n+1)*(n+2)/2` avoids int overflow.

</details>


---

## Reality Check

**"ArrayList and Array are the same thing"** → `int[]` is a contiguous block of raw ints in memory — no object headers, no capacity metadata, fixed size. `ArrayList<Integer>` stores *boxed* Integer objects (each 16 bytes on JVM), holds pointers to them, has a capacity buffer (1.5× growth), and incurs boxing/unboxing on every access. For numeric data, a primitive array is 4-8× more memory-efficient.

**"Array index out of bounds crashes are just off-by-one errors"** → Off-by-one is *one cause*. The actual check: the JVM verifies `0 ≤ index < length` on every array access. In C, there is no such check — you silently read/write adjacent memory (buffer overflow). This is a major class of security vulnerabilities. Java's bounds checking costs ~1 CPU cycle per access but prevents entire exploit categories.

**"`array2 = array1` makes a copy"** → It copies the *reference*. Both variables now point to the same array object. Mutating `array2[0]` changes `array1[0]` too. To copy: `Arrays.copyOf(array1, array1.length)` or `array1.clone()`.

**"2D arrays in Java are rectangular grids stored in a grid"** → A Java `int[][]` is an array of *references to* `int[]` arrays. Each row is a separate heap object. They need not be the same length (jagged arrays). Memory is NOT contiguous between rows — cache misses on row transitions. For performance-critical matrix math, use a flattened 1D array and compute `[row * cols + col]` manually.

**"Passing an array to a method is pass-by-value, so the original won't change"** → Java is always pass-by-value, but for arrays the *value* passed is the reference (memory address). The method receives the same reference and CAN mutate the array contents. What it cannot do is make the caller's variable point to a different array.
