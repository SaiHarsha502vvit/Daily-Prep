

---

## Reality Check

**"Two pointers only work on sorted arrays"** → Two pointers work on: sorted arrays (two-sum problem — converge from ends), unsorted arrays for same-direction pointers (fast/slow for cycle detection, partition in quicksort), strings (valid palindrome — converge from ends without sorting). The "sorted" requirement applies only to the converging-pointers pattern where the invariant requires sorted order (moving the left pointer increases sum, moving right decreases). Same-direction two pointers (sliding window) do not require sorting.

**"Sliding window is always O(n)"** → The outer loop runs n times; the inner while loop (expanding/shrinking the window) runs at most n times total across all outer iterations — each element enters the window once and leaves once. Total operations: 2n = O(n). This amortised reasoning is the same as stack-based O(n) algorithms. BUT: if the per-element operation inside the window is not O(1) (e.g., updating a `TreeMap` for "window of distinct elements sorted"), the overall complexity is O(n log n). The O(n) claim assumes O(1) window expansion/contraction operations.

**"The two-pointer pattern for two-sum only works with no duplicates"** → With duplicates: the converging pointers still work. If `arr[l] + arr[r] == target`, that pair is valid — then advance both pointers (`l++; r--`) to find additional pairs. Handle duplicate values in the next pointer positions by skipping (`while l < r && arr[l] == arr[l-1]: l++`). The uniqueness constraint matters only when you need to count/output distinct pairs — the core pointer logic works with duplicates.

**"Sliding window and two pointers are different techniques"** → Sliding window IS two pointers (same-direction). The window is defined by two pointers: `left` and `right`. The right pointer expands the window; the left pointer shrinks it. In "fixed-size window" problems, both advance together. In "variable-size window" problems (longest substring without repeating characters), the left advances when an invariant is violated. The conceptual framing differs (window vs pointers) but the implementation is identical.

**"Floyd's cycle detection (fast/slow pointers) only detects cycles"** → Floyd's algorithm (tortoise and hare): once the two pointers meet inside the cycle, you can ALSO find the START of the cycle. Reset the slow pointer to the head; advance both at speed 1 — they meet at the cycle start. Proof uses the distances: if the cycle starts at position μ and has length λ, the meeting point is λ - (μ mod λ) steps into the cycle. This finds the duplicate in O(1) extra space for the "find duplicate in array" problem where the array encodes a linked list via indices.
