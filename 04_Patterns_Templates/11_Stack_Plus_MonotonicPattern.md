# Stack + Monotonic Pattern — Combined Pattern Guide

> **WHY this combination?** A stack processes elements in LIFO order. A **monotonic stack** maintains elements in sorted order, enabling O(n) solutions for "next greater/smaller element" problems that seem to need O(n²).

---

## 🧠 WHEN TO RECOGNIZE THIS PATTERN

```
IF the problem says:
  ✅ "Next greater/smaller element"
  ✅ "Previous greater/smaller element"
  ✅ "Largest rectangle" / "Maximal area"
  ✅ "Stock span" / "Days until warmer"
  ✅ "Remove digits to make smallest/largest"
  ✅ "Expression evaluation" / Parentheses
THEN → Stack (often Monotonic)
```

### Monotonic Stack Types
```
Monotonic INCREASING stack:     Monotonic DECREASING stack:
Bottom → Top: small → big      Bottom → Top: big → small
Pop when: new < top             Pop when: new > top
Use for: NEXT SMALLER           Use for: NEXT GREATER

Stack: [1, 3, 5, 7]            Stack: [9, 7, 4, 2]
Push 4 → pop 7,5 → [1,3,4]    Push 6 → pop 2,4 → [9,7,6]
```

---

## 📐 CORE TEMPLATES

### Template 1: Next Greater Element
```java
// For each element, find next greater to the right
int[] nextGreater = new int[n];
Arrays.fill(nextGreater, -1);
Deque<Integer> stack = new ArrayDeque<>();  // stores INDICES

for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
        nextGreater[stack.pop()] = arr[i];  // arr[i] is the answer
    }
    stack.push(i);
}
```

### Template 2: Largest Rectangle in Histogram
```java
// Classic monotonic stack problem
Deque<Integer> stack = new ArrayDeque<>();
int maxArea = 0;

for (int i = 0; i <= heights.length; i++) {
    int h = (i == heights.length) ? 0 : heights[i];
    while (!stack.isEmpty() && heights[stack.peek()] > h) {
        int height = heights[stack.pop()];
        int width = stack.isEmpty() ? i : i - stack.peek() - 1;
        maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
}
```

### Template 3: Stock Span / Online Processing
```java
// Consecutive days before with price ≤ today
Deque<int[]> stack = new ArrayDeque<>();  // [price, span]
int span = 1;
while (!stack.isEmpty() && stack.peek()[0] <= price) {
    span += stack.pop()[1];
}
stack.push(new int[]{price, span});
return span;
```

---

## 🔬 VISUAL: Monotonic Stack for Next Greater

```
Array: [4, 2, 8, 1, 5, 3]

Processing left to right, decreasing stack (for next greater):

i=0: arr[0]=4  stack=[] → push 0           stack=[0]       (4)
i=1: arr[1]=2  2<4 → push 1                stack=[0,1]     (4,2)
i=2: arr[2]=8  8>2 → pop 1, ans[1]=8       stack=[0]       (4)
                8>4 → pop 0, ans[0]=8       stack=[]
                push 2                      stack=[2]       (8)
i=3: arr[3]=1  1<8 → push 3                stack=[2,3]     (8,1)
i=4: arr[4]=5  5>1 → pop 3, ans[3]=5       stack=[2]       (8)
                5<8 → push 4                stack=[2,4]     (8,5)
i=5: arr[5]=3  3<5 → push 5                stack=[2,4,5]   (8,5,3)

Remaining: ans[2]=-1, ans[4]=-1, ans[5]=-1

Result: [8, 8, -1, 5, -1, -1]
```

---

## � FULL WALKTHROUGH: Largest Rectangle in Histogram

```
Problem: Find the largest rectangle area in a histogram.
         heights = [2, 1, 5, 6, 2, 3]

Approach: Monotonic INCREASING stack. When a shorter bar appears,
          pop taller bars and compute their max rectangle.

WHY monotonic stack? Each bar needs to know "how far left and right
can I extend?" = "nearest shorter bar on each side." That's exactly
what a monotonic stack gives us in O(n).

Step-by-step (stack stores INDICES):
  i=0, h=2: stack=[0]
  i=1, h=1: h < stack top(2) → pop 0
            width = 1 (no left bound), area = 2×1 = 2
            stack=[1]
  i=2, h=5: stack=[1,2]
  i=3, h=6: stack=[1,2,3]
  i=4, h=2: h < stack top(6) → pop 3
            width = 4-2-1 = 1, area = 6×1 = 6
            h < stack top(5) → pop 2
            width = 4-1-1 = 2, area = 5×2 = 10 ← MAX!
            stack=[1,4]
  i=5, h=3: stack=[1,4,5]
  Cleanup: pop remaining, compute areas.

  Answer: 10 ✅ (bars at index 2-3, height 5, width 2)

Time: O(n) | Space: O(n)
Trick: Add sentinel 0 at end to auto-trigger final cleanup.
```

---

## 🔬 FULL WALKTHROUGH 2: Next Greater Element I — Core Monotonic Template

```
Problem: For each element in nums1, find the Next Greater Element in nums2.
         nums1 = [4, 1, 2], nums2 = [1, 3, 4, 2]

Approach: Process nums2 with monotonic DECREASING stack.
          Map each element to its NGE. Then look up nums1 answers.

Step-by-step (build NGE map from nums2):
  stack = [], map = {}

  i=0, num=1: stack=[1]
  i=1, num=3: 3 > stack top(1) → pop 1, map[1]=3
              stack=[3]
  i=2, num=4: 4 > stack top(3) → pop 3, map[3]=4
              stack=[4]
  i=3, num=2: 2 < stack top(4) → push
              stack=[4, 2]
  Remaining: 4→-1, 2→-1

  NGE map: {1:3, 3:4, 4:-1, 2:-1}

  Answer for nums1: [4→-1, 1→3, 2→-1] = [-1, 3, -1] ✅

Time: O(n + m) | Space: O(n)
KEY: Stack stores elements waiting for their NGE.
     When a larger element arrives, it's the answer for all smaller ones on stack.
```

---

## 🛡️ EDGE CASES

```
┌────────────────────────────────┬─────────────────────────────────────────┐
│ Edge Case                      │ Handling                                │
├────────────────────────────────┼─────────────────────────────────────────┤
│ All decreasing [5,4,3,2,1]    │ No element has NGE → all -1              │
│ All increasing [1,2,3,4,5]    │ Every element except last has NGE        │
│ All same values [3,3,3]       │ No strictly greater → all -1             │
│ Single element [7]            │ No NGE → -1                              │
│ Circular array (NGE II)       │ Loop 2×n, use index % n                  │
│ Histogram: all same height    │ Area = height × n                        │
│ Histogram: sorted ascending   │ Stack never pops until cleanup           │
└────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 📊 COMPLEXITY SUMMARY

| Problem | Time | Space | Key Detail |
|---------|------|-------|------------|
| Next Greater Element | O(n) | O(n) | Each element pushed/popped once |
| Largest Rectangle | O(n) | O(n) | Sentinel simplifies cleanup |
| Stock Span | O(n) amortized | O(n) | Monotonic decreasing |
| Sum of Subarray Mins | O(n) | O(n) | Contribution technique |
| Daily Temperatures | O(n) | O(n) | Store indices, not values |

---

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 1 | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | — | Two stacks for amortized O(1) |
| 2 | [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) | Amazon | Push expensive or pop expensive |
| 3 | [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) | — | Monotonic stack + HashMap |
| 4 | [Evaluate Postfix Expression](https://www.geeksforgeeks.org/stack-set-4-evaluation-postfix-expression/) | Salesforce | Classic stack evaluation |
| 5 | [Implement Deque](https://www.geeksforgeeks.org/implement-stack-queue-using-deque/) | Salesforce, Microsoft | Deque supports both ends |

### Medium
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 6 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | Amazon | Monotonic decreasing + span merge |
| 7 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | Salesforce | Monotonic stack + contribution counting |
| 8 | [Remove All Adjacent Duplicates II](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string-ii/) | Amazon | Stack with count tracking |
| 9 | [Rotten Oranges](https://practice.geeksforgeeks.org/problems/rotten-oranges2536/1) | Salesforce | Multi-source BFS (not stack, but queue!) |
| 10 | [Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/) | — | Monotonic decreasing stack |
| 11 | [Flatten Nested List Iterator](https://leetcode.com/problems/flatten-nested-list-iterator/) | — | Stack for recursive flattening |
| 12 | [Circular Tour](https://practice.geeksforgeeks.org/problems/circular-tour/1) | — | Greedy (or stack simulation) |

### Hard
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 13 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | — | Classic monotonic stack |
| 14 | [Max of Minimums for Every Window Size](https://www.geeksforgeeks.org/find-the-maximum-of-minimums-for-every-window-size-in-a-given-array/) | Salesforce, Microsoft | Monotonic stack + fill technique |
| 15 | [LRU Cache](https://www.geeksforgeeks.org/lru-cache-implementation/) | Microsoft | HashMap + Doubly Linked List |
| 16 | [The Celebrity Problem](http://geeksforgeeks.org/the-celebrity-problem/) | — | Stack elimination |

### Additional — Stacks & Queues from Excel
| # | Problem | Key Insight |
|---|---------|-------------|
| 17 | [Distance of Nearest Cell Having 1](https://practice.geeksforgeeks.org/problems/distance-of-nearest-cell-having-1-1587115620/1) | Multi-source BFS |
| 18 | [Implement Two Stacks in Array](https://www.geeksforgeeks.org/implement-two-stacks-in-an-array/) | Start from opposite ends |
| 19 | Sum of min-max elements of subarrays of size k | Monotonic deque |
| 20 | Efficiently implement k-queues in single array | Array segmentation |

---

## ⚠️ COMMON MISTAKES

1. **Using Stack class** — Use `Deque<Integer> stack = new ArrayDeque<>()` (Stack is legacy)
2. **Forgetting boundary element** — Add sentinel value (0) at end for histogram problems
3. **Increasing vs Decreasing confusion** — Draw it out! Increasing finds next SMALLER, Decreasing finds next GREATER
4. **Off-by-one in width** — In histogram: `width = stack.isEmpty() ? i : i - stack.peek() - 1`

---

📖 **Related Chapters:**
- [02_Data_Structures/01d_Stack_Queue.md](../02_Data_Structures/01d_Stack_Queue.md) — Stack/Queue fundamentals
- [03_Algorithms/15_Monotonic_Stack_Queue_Complete.md](../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md) — Deep dive

---
[← 10 HashMap+Counting](10_HashMap_Plus_Counting.md) | [12 LinkedList+TwoPointers →](12_LinkedList_Plus_TwoPointers.md)
