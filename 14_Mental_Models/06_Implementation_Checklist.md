# ✅ Implementation Checklist — Things to Remember While Writing Code

> **The key insight**: Most bugs aren't from wrong algorithms — they're from careless implementation mistakes. This checklist prevents the 20 most common errors that cost you time in interviews and contests.

---

## Part 1: Before You Write ANY Code

```
□ Do I have a clear plan? (Can I explain my approach in 2-3 sentences?)
□ What data structures am I using? (Declared them mentally)
□ What are my key variables? (Named them meaningfully)
□ Did I handle the edge cases in my head?
  □ Empty input (null, length 0)
  □ Single element
  □ All same values
  □ Very large input (will my approach TLE?)
```

---

## Part 2: The Big 10 — Most Common Bugs

### Bug #1: Off-by-One Errors
```java
// WRONG: Accessing arr[n] (index out of bounds)
for (int i = 0; i <= arr.length; i++)  // ❌ <= should be <

// CORRECT:
for (int i = 0; i < arr.length; i++)   // ✅

// REMEMBER:
// Array index: 0 to n-1
// String index: 0 to s.length()-1
// Substring: s.substring(start, end) → end is EXCLUSIVE
// Loop n times: for (i = 0; i < n; i++)
// Loop from a to b inclusive: for (i = a; i <= b; i++)
```

### Bug #2: Integer Overflow
```java
// WRONG: Overflow when multiplying
int result = a * b;  // ❌ if a,b are large → overflow

// CORRECT: Cast to long BEFORE multiplication
long result = (long) a * b;  // ✅

// Common overflow traps:
// - Sum of array elements → use long
// - Factorial → use long (13! > Integer.MAX_VALUE)
// - mid = (left + right) / 2 → mid = left + (right - left) / 2
// - Modular arithmetic → apply mod at each step
```

### Bug #3: Null Pointer
```java
// ALWAYS check before using:
if (node != null && node.val == target)  // ✅ Short-circuit
if (str != null && !str.isEmpty())       // ✅
if (list != null && !list.isEmpty())     // ✅

// Tree traversal: ALWAYS check null first
if (root == null) return;  // Base case FIRST
```

### Bug #4: Modifying Collection While Iterating
```java
// WRONG:
for (int item : list) {
    if (condition) list.remove(item);  // ❌ ConcurrentModification
}

// CORRECT: Use Iterator or collect indices first
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (condition) it.remove();  // ✅
}

// OR: Build a new list
List<Integer> result = list.stream()
    .filter(x -> !condition)
    .collect(Collectors.toList());
```

### Bug #5: Wrong HashMap Default
```java
// WRONG: Getting from map without default
int count = map.get(key);  // ❌ NullPointerException if key missing

// CORRECT:
int count = map.getOrDefault(key, 0);  // ✅

// BETTER for frequency counting:
map.merge(key, 1, Integer::sum);  // ✅ Increment or set to 1
```

### Bug #6: Comparing Objects with == Instead of .equals()
```java
// WRONG:
if (str1 == str2)        // ❌ Compares reference, not content
if (num1 == num2)        // ❌ For Integer objects > 127, this fails!

// CORRECT:
if (str1.equals(str2))   // ✅ Compares content
if (num1.equals(num2))   // ✅ For Integer objects
// Or: if (num1.intValue() == num2.intValue())  // ✅
```

### Bug #7: Forgetting to Initialize
```java
// WRONG: Using uninitialized variables
int max;                     // ❌ 
for (...) max = Math.max(max, val);

// CORRECT: Initialize to appropriate extreme
int max = Integer.MIN_VALUE; // ✅ For finding maximum
int min = Integer.MAX_VALUE; // ✅ For finding minimum
int sum = 0;                 // ✅ For accumulating
boolean found = false;       // ✅ For flags
```

### Bug #8: Array/String Creation Confusion
```java
// Array:
int[] arr = new int[n];           // Size n, all zeros
int[][] grid = new int[m][n];     // m rows, n cols
Arrays.fill(arr, -1);             // Fill all with -1

// String:
char[] chars = s.toCharArray();   // Convert to char array
String back = new String(chars);  // Convert back
String sub = s.substring(i, j);   // i inclusive, j EXCLUSIVE

// ArrayList:
List<List<Integer>> result = new ArrayList<>();
result.add(new ArrayList<>(current));  // Add COPY, not reference!
```

### Bug #9: BFS Visited Timing
```java
// WRONG: Mark visited when DEQUEUING
while (!queue.isEmpty()) {
    int node = queue.poll();
    visited[node] = true;  // ❌ TOO LATE — may already be in queue again!
    for (int neighbor : adj[node]) {
        if (!visited[neighbor]) queue.offer(neighbor);
    }
}

// CORRECT: Mark visited when ENQUEUING
queue.offer(start);
visited[start] = true;  // ✅ Mark immediately
while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int neighbor : adj[node]) {
        if (!visited[neighbor]) {
            visited[neighbor] = true;  // ✅ Mark when adding
            queue.offer(neighbor);
        }
    }
}
```

### Bug #10: Forgetting Deep Copy
```java
// WRONG: Adding reference to result (will change later!)
List<Integer> path = new ArrayList<>();
result.add(path);      // ❌ path is a reference — future changes affect result!

// CORRECT: Add a COPY
result.add(new ArrayList<>(path));  // ✅ Independent copy

// This is critical in backtracking!
// After unchoose, the original path changes — but the copy in result stays correct
```

---

## Part 3: Language-Specific Java Gotchas

### Priority Queue (Min-Heap vs Max-Heap)
```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();           // Default: min
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// For custom objects:
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
// ⚠️ WARNING: a - b can overflow! For safety:
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
```

### Sorting Gotchas
```java
// Primitive array — ascending:
Arrays.sort(arr);

// Object array — custom:
Arrays.sort(arr, (a, b) -> a[0] - b[0]);  // ⚠️ overflow risk
Arrays.sort(arr, Comparator.comparingInt(a -> a[0]));  // ✅ safer

// List — sort:
list.sort(Comparator.naturalOrder());

// Sort descending (objects only):
Arrays.sort(arr, Comparator.reverseOrder());  // Only for Integer[], not int[]
```

### String Operations Cheat Sheet
```java
s.charAt(i)          // char at index i
s.length()           // length (note: PARENTHESES — it's a method)
arr.length           // array length (note: NO parentheses — it's a field)
list.size()          // list size

s.substring(i, j)    // from i (inclusive) to j (EXCLUSIVE)
s.indexOf("abc")     // first occurrence, -1 if not found
s.contains("abc")    // boolean
s.toCharArray()      // char[]
String.valueOf(num)  // int → String
Integer.parseInt(s)  // String → int
```

---

## Part 4: Complexity Verification Checklist

After writing code, verify:
```
□ What's my time complexity? _____
  → Is it within constraint? (n ≤ 10⁵ needs O(n log n) or better)
□ What's my space complexity? _____
  → Am I using unnecessary extra space?
□ Am I creating objects in a loop?
  → Can I reuse them? (StringBuilder, arrays)
□ Am I using recursion?
  → Max stack depth? (Java default ~10,000 frames)
  → Should I convert to iterative?
```

---

## Part 5: Quick Pre-Submission Checklist

```
□ Return type matches what's asked (int vs long vs int[] vs List)
□ Variable names won't confuse me
□ No leftover debug print statements
□ Edge cases handled (empty, null, single, negative)
□ Correct loop bounds (< vs <=)
□ Used long where overflow is possible
□ HashMap: used getOrDefault
□ ArrayList: added copies in backtracking
□ BFS: marked visited on enqueue
□ Binary search: used left + (right - left) / 2
```

---

📖 **Related Files:**
- [05_Universal_Problem_Framework.md](05_Universal_Problem_Framework.md) — 6-step approach
- [08_Debugging_DryRun.md](08_Debugging_DryRun.md) — Finding bugs systematically
- [05_Problem_Solving/03_Common_Mistakes.md](../05_Problem_Solving/03_Common_Mistakes.md) — Extended mistake catalog

---
[← 05 Universal Framework](05_Universal_Problem_Framework.md) | [07 SQL Mental Pipeline →](07_SQL_Mental_Pipeline.md)
