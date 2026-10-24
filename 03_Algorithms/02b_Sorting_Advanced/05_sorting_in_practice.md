# PART 14: Sorting in Practice

> **Navigation**: [← Sorting Algorithm Variations](04_sorting_algorithm_variations.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting-Based Interview Problems →](06_sorting_based_interview_problems.md)
> Page 5 of 6 in **Sorting Advanced**


## Custom Comparators in Java

```java
// Sort objects by custom criteria
class Person {
    String name;
    int age;
}

// Sort by age ascending
Arrays.sort(people, (a, b) -> a.age - b.age);

// Sort by name, then by age
Arrays.sort(people, (a, b) -> {
    int nameCompare = a.name.compareTo(b.name);
    if (nameCompare != 0) return nameCompare;
    return a.age - b.age;
});

// Using Comparator chaining
Arrays.sort(people,
    Comparator.comparing(Person::getName)
              .thenComparingInt(Person::getAge)
              .reversed());

// Sort integers as strings (lexicographic)
Integer[] nums = {3, 30, 34, 5, 9};
Arrays.sort(nums, (a, b) -> (b + "" + a).compareTo(a + "" + b));
// Result: [9, 5, 34, 3, 30] -> "9534330" (largest number)

// Partial sort: sort only part of array
Arrays.sort(arr, fromIndex, toIndex);
```

🔬 **Section Challenge — Custom Comparators in Java**

**Challenge 1 (Bug Hunt):** You sort intervals with `(a, b) -> a[0] - b[0]`, and coordinates may be close to `Integer.MIN_VALUE` or `Integer.MAX_VALUE`. What can break, and what comparator should you use?

<details><summary>Trace, Reasoning & Debug</summary>

Subtraction can overflow, so a smaller value may look larger and the comparator can violate ordering rules. Broken comparators create wrong sorted order and can even trigger `Comparison method violates its general contract`.

Use `Integer.compare(a[0], b[0])` for the primary key and add tie-breakers explicitly: `Comparator.<int[]>comparingInt(x -> x[0]).thenComparingInt(x -> x[1])`. The mental rule: comparator code must express ordering, not arithmetic shortcuts.

</details>

## Sorting Linked Lists

```java
// Merge sort is ideal for linked lists (O(1) space if using bottom-up)
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // Find middle
    ListNode slow = head, fast = head, prev = null;
    while (fast != null && fast.next != null) {
        prev = slow;
        slow = slow.next;
        fast = fast.next.next;
    }
    prev.next = null;  // Split the list

    // Sort each half
    ListNode left = sortList(head);
    ListNode right = sortList(slow);

    // Merge
    return merge(left, right);
}

private ListNode merge(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;

    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }

    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

🔬 **Section Challenge — Sorting Linked Lists**

**Challenge 1 (Constraint Reasoning):** Why is merge sort usually the natural choice for sorting a linked list, while array-style QuickSort is awkward?

<details><summary>Trace, Reasoning & Debug</summary>

Linked lists have no random access, so partitioning around a pivot and jumping by index is painful. Merge sort fits the structure: split with slow/fast pointers, recursively sort halves, then merge by rewiring `next` pointers.

The constraint lens is: no indexing means prefer pointer-friendly algorithms. Merge sort gives `O(N log N)` time, stable ordering, and can be implemented with low extra memory because merging lists does not require copying into an array.

</details>

## External Sorting (Large Files)

```
CONCEPT:
When data doesn't fit in memory, use external merge sort.

ALGORITHM:
1. Divide file into chunks that fit in memory
2. Sort each chunk in memory, write to temp files
3. Merge sorted temp files (k-way merge)

KEY CONSIDERATIONS:
- Use BufferedReader/Writer for efficient I/O
- Minimize number of disk seeks
- Use memory-mapped files for better performance
```

```java
// Simplified k-way merge concept
public void kWayMerge(List<Scanner> sortedFiles, PrintWriter output) {
    // Min-heap to track smallest element from each file
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);

    // Initialize with first element from each file
    for (int i = 0; i < sortedFiles.size(); i++) {
        if (sortedFiles.get(i).hasNextInt()) {
            pq.offer(new int[]{sortedFiles.get(i).nextInt(), i});
        }
    }

    while (!pq.isEmpty()) {
        int[] min = pq.poll();
        output.println(min[0]);

        // Add next element from same file
        if (sortedFiles.get(min[1]).hasNextInt()) {
            pq.offer(new int[]{sortedFiles.get(min[1]).nextInt(), min[1]});
        }
    }
}
```

---

🔬 **Section Challenge — External Sorting (Large Files)**

**Challenge 1 (Constraint Reasoning):** You must sort a `200GB` log file on a machine with `2GB` free RAM. Why does normal in-memory sorting fail, and what is the external sorting plan?

<details><summary>Trace, Reasoning & Debug</summary>

The input is larger than memory, so loading everything into an array will page heavily or crash. The correct category is external memory sorting, not "find a faster comparator."

Split the file into RAM-sized chunks, sort each chunk in memory, write sorted runs to disk, then k-way merge the runs with a min-heap over the current head of each run. Tune chunk size, merge fan-in, buffer size, and temp file cleanup around memory and file descriptor limits.

</details>

---

[← Sorting Algorithm Variations](04_sorting_algorithm_variations.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting-Based Interview Problems →](06_sorting_based_interview_problems.md)
