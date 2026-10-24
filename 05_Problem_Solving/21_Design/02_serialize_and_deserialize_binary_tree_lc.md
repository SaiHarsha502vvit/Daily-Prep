# PROBLEM 10: Serialize and Deserialize Binary Tree (LC 297)

> **Navigation**: [← WHY Design Problems — Thinking Like an…](01_why_design_problems_thinking_like_an.md) | [Chapter overview](../21_Design.md)
> Page 2 of 2 in **SECTION: DESIGN PROBLEMS**


```
DIFFICULTY: Hard
COMPANIES: Amazon, Facebook, Google, Microsoft
PATTERN: BFS/DFS + String encoding

PROBLEM: Encode a binary tree to string and decode back.

SOLUTION (Preorder DFS):
```

```java
public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeDFS(root, sb);
        return sb.toString();
    }

    private void serializeDFS(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("null,"); return; }
        sb.append(node.val).append(",");
        serializeDFS(node.left, sb);
        serializeDFS(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeDFS(queue);
    }

    private TreeNode deserializeDFS(Queue<String> queue) {
        String val = queue.poll();
        if ("null".equals(val)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeDFS(queue);
        node.right = deserializeDFS(queue);
        return node;
    }
}
```

```
COMPLEXITY: O(n) for both serialize and deserialize | Space O(n)
KEY: Using "null" markers preserves the tree structure uniquely.
```

---

## Problem 11: Flatten Nested List Iterator

**LeetCode 341** | **Difficulty:** Medium

**FLATTEN NESTED LIST ITERATOR (LeetCode 341 - Medium)**

```text
Given nested list of integers, implement iterator to flatten it.
Example: [[1,1],2,[1,1]] → 1, 1, 2, 1, 1

KEY: Use stack. Push elements in reverse. Flatten on hasNext().
TIME: O(1) amortized next/hasNext | SPACE: O(D) depth of nesting
```

```java
public class NestedIterator implements Iterator<Integer> {
    private Deque<NestedInteger> stack;

    public NestedIterator(List<NestedInteger> nestedList) {
        stack = new ArrayDeque<>();
        for (int i = nestedList.size() - 1; i >= 0; i--)
            stack.push(nestedList.get(i));
    }

    public Integer next() {
        return stack.pop().getInteger();
    }

    public boolean hasNext() {
        while (!stack.isEmpty() && !stack.peek().isInteger()) {
            List<NestedInteger> list = stack.pop().getList();
            for (int i = list.size() - 1; i >= 0; i--)
                stack.push(list.get(i));
        }
        return !stack.isEmpty();
    }
}
```

---

## Problem 12: Design Circular Queue

**LeetCode 622** | **Difficulty:** Medium

**DESIGN CIRCULAR QUEUE (LeetCode 622 - Medium)**

```text
Implement circular queue with: enQueue, deQueue, Front, Rear,
isEmpty, isFull.

KEY: Array with head/tail pointers, modular arithmetic.
All operations O(1)
```

```java
class MyCircularQueue {
    private int[] data;
    private int head, tail, size, capacity;

    public MyCircularQueue(int k) {
        data = new int[k];
        capacity = k;
        head = 0; tail = -1; size = 0;
    }

    public boolean enQueue(int value) {
        if (isFull()) return false;
        tail = (tail + 1) % capacity;
        data[tail] = value;
        size++;
        return true;
    }

    public boolean deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % capacity;
        size--;
        return true;
    }

    public int Front() { return isEmpty() ? -1 : data[head]; }
    public int Rear()  { return isEmpty() ? -1 : data[tail]; }
    public boolean isEmpty() { return size == 0; }
    public boolean isFull()  { return size == capacity; }
}
```

---

## Problem 13: Snapshot Array

**LeetCode 1146** | **Difficulty:** Medium

**SNAPSHOT ARRAY (LeetCode 1146 - Medium)**

```text
Implement: set(index, val), snap() → snapId, get(index, snapId)

Example:
set(0,5) → snap()=0 → set(0,6) → get(0,0) → 5

KEY: Store list of (snapId, value) per index. Binary search on get.
set/snap O(1), get O(log S) where S = number of snaps
```

```java
class SnapshotArray {
    private List<int[]>[] history; // history[index] = list of [snapId, value]
    private int snapId;

    public SnapshotArray(int length) {
        history = new List[length];
        for (int i = 0; i < length; i++) {
            history[i] = new ArrayList<>();
            history[i].add(new int[]{0, 0});
        }
        snapId = 0;
    }

    public void set(int index, int val) {
        List<int[]> list = history[index];
        if (list.get(list.size() - 1)[0] == snapId)
            list.get(list.size() - 1)[1] = val;
        else
            list.add(new int[]{snapId, val});
    }

    public int snap() { return snapId++; }

    public int get(int index, int snap_id) {
        List<int[]> list = history[index];
        int lo = 0, hi = list.size() - 1, result = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid)[0] <= snap_id) {
                result = list.get(mid)[1];
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return result;
    }
}
```

---

## Problem 14: Stock Price Fluctuation

**LeetCode 2034** | **Difficulty:** Medium

**STOCK PRICE FLUCTUATION (LeetCode 2034 - Medium)**

```text
Implement: update(timestamp, price), current(), maximum(), minimum()
update can CORRECT previous timestamp's price.

KEY: HashMap for timestamp→price + TreeMap for price frequencies.
update O(log n), current/max/min O(1)
```

```java
class StockPrice {
    private Map<Integer, Integer> timestampPrice;
    private TreeMap<Integer, Integer> priceCount;
    private int latestTimestamp;

    public StockPrice() {
        timestampPrice = new HashMap<>();
        priceCount = new TreeMap<>();
        latestTimestamp = 0;
    }

    public void update(int timestamp, int price) {
        latestTimestamp = Math.max(latestTimestamp, timestamp);
        if (timestampPrice.containsKey(timestamp)) {
            int oldPrice = timestampPrice.get(timestamp);
            priceCount.merge(oldPrice, -1, Integer::sum);
            if (priceCount.get(oldPrice) == 0)
                priceCount.remove(oldPrice);
        }
        timestampPrice.put(timestamp, price);
        priceCount.merge(price, 1, Integer::sum);
    }

    public int current() { return timestampPrice.get(latestTimestamp); }
    public int maximum() { return priceCount.lastKey(); }
    public int minimum() { return priceCount.firstKey(); }
}
```

---

## Problem 15: Find Median from Data Stream

**LeetCode 295** | **Difficulty:** Hard

**FIND MEDIAN FROM DATA STREAM (LeetCode 295 - Hard)**

```text
addNum(int num) — add integer from data stream
findMedian() — return median of all elements so far

Example:
add(1), add(2) → median=1.5, add(3) → median=2.0

KEY: Two heaps — maxHeap for lower half, minHeap for upper half.
Keep balanced: |maxHeap.size - minHeap.size| <= 1
addNum O(log n), findMedian O(1)
```

```java
class MedianFinder {
    private PriorityQueue<Integer> maxHeap; // lower half
    private PriorityQueue<Integer> minHeap; // upper half

    public MedianFinder() {
        maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        minHeap = new PriorityQueue<>();
    }

    public void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll()); // balance: largest of lower → upper
        if (minHeap.size() > maxHeap.size())
            maxHeap.offer(minHeap.poll()); // keep maxHeap >= minHeap
    }

    public double findMedian() {
        if (maxHeap.size() > minHeap.size())
            return maxHeap.peek();
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}
```

---

[← WHY Design Problems — Thinking Like an…](01_why_design_problems_thinking_like_an.md) | [Chapter overview](../21_Design.md)
