# Day 09 - Stack and Monotonic Stack (Reasoning-First Notes)

## Daily Problem Set
1. LeetCode Premium: 716 - Max Stack
2. LeetCode Hard: 84 - Largest Rectangle in Histogram
3. Codeforces: 1313C2 - Skyscrapers (harder variant)
4. Codeforces: 4C - Registration System

## Problem Links
- LC 716 (Premium): Locked on LeetCode (no public official statement page)
- LC 84: https://leetcode.com/problems/largest-rectangle-in-histogram/
- CF 1313C2: https://codeforces.com/problemset/problem/1313/C2
- CF 4C: https://codeforces.com/problemset/problem/4/C

## Why This Day Matters
Monotonic stacks are about preserving order constraints and answering nearest-smaller/greater in linear time.

---

## Problem 1 - LC 716 (Premium): Max Stack

### Problem Statement
Design stack supporting `push`, `pop`, `top`, `peekMax`, `popMax`.

### Why This DS/Algo
- Normal stack cannot pop arbitrary max quickly.
- Combine doubly linked list for O(1) removals with ordered structure by value.

### Approach A - Brute Force (single stack) (push O(1), popMax O(n))

```java
class MaxStackBrute {
    private final Deque<Integer> st = new ArrayDeque<>();

    public void push(int x) { st.push(x); }
    public int pop() { return st.pop(); }
    public int top() { return st.peek(); }

    public int peekMax() {
        int mx = Integer.MIN_VALUE;
        for (int x : st) mx = Math.max(mx, x);
        return mx;
    }

    public int popMax() {
        int mx = peekMax();
        Deque<Integer> buf = new ArrayDeque<>();
        while (st.peek() != mx) buf.push(st.pop());
        st.pop();
        while (!buf.isEmpty()) st.push(buf.pop());
        return mx;
    }
}
```

### Approach B - Better (Two stacks) (popMax still O(n))
Keep max-stack for fast `peekMax`.

```java
class MaxStackBetter {
    private final Deque<Integer> st = new ArrayDeque<>();
    private final Deque<Integer> mx = new ArrayDeque<>();

    public void push(int x) {
        st.push(x);
        if (mx.isEmpty()) mx.push(x);
        else mx.push(Math.max(x, mx.peek()));
    }

    public int pop() { mx.pop(); return st.pop(); }
    public int top() { return st.peek(); }
    public int peekMax() { return mx.peek(); }

    public int popMax() {
        int m = mx.peek();
        Deque<Integer> buf = new ArrayDeque<>();
        while (st.peek() != m) buf.push(pop());
        pop();
        while (!buf.isEmpty()) push(buf.pop());
        return m;
    }
}
```

### Approach C - Optimal (DLL + TreeMap) (all operations near O(log n))

```java
class MaxStackOptimal {
    static class Node {
        int v;
        Node prev, next;
        Node(int v) { this.v = v; }
    }

    private final Node head = new Node(0), tail = new Node(0);
    private final TreeMap<Integer, ArrayDeque<Node>> map = new TreeMap<>();

    public MaxStackOptimal() {
        head.next = tail;
        tail.prev = head;
    }

    private Node addLast(int x) {
        Node n = new Node(x);
        Node p = tail.prev;
        p.next = n; n.prev = p;
        n.next = tail; tail.prev = n;
        return n;
    }

    private void remove(Node n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }

    public void push(int x) {
        Node n = addLast(x);
        map.computeIfAbsent(x, z -> new ArrayDeque<>()).push(n);
    }

    public int pop() {
        Node n = tail.prev;
        remove(n);
        ArrayDeque<Node> dq = map.get(n.v);
        dq.pop();
        if (dq.isEmpty()) map.remove(n.v);
        return n.v;
    }

    public int top() { return tail.prev.v; }
    public int peekMax() { return map.lastKey(); }

    public int popMax() {
        int m = map.lastKey();
        ArrayDeque<Node> dq = map.get(m);
        Node n = dq.pop();
        if (dq.isEmpty()) map.remove(m);
        remove(n);
        return m;
    }
}
```

---

## Problem 2 - LC 84: Largest Rectangle in Histogram

### Why This DS/Algo
Area for each bar is determined by nearest smaller on both sides. Monotonic increasing stack computes both boundaries in O(n).

### Approach A - Brute Force (O(n^2), O(1))
For each center bar, expand while heights >= current.

### Approach B - Better (precompute left/right smaller) (O(n), O(n))

```java
static int largestRectBetter(int[] h) {
    int n = h.length;
    int[] L = new int[n], R = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && h[st.peek()] >= h[i]) st.pop();
        L[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }

    st.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && h[st.peek()] >= h[i]) st.pop();
        R[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }

    int ans = 0;
    for (int i = 0; i < n; i++) {
        ans = Math.max(ans, h[i] * (R[i] - L[i] - 1));
    }
    return ans;
}
```

### Approach C - Optimal (Single pass stack) (O(n), O(n))

```java
static int largestRectOptimal(int[] h) {
    int n = h.length, ans = 0;
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i <= n; i++) {
        int cur = (i == n ? 0 : h[i]);
        while (!st.isEmpty() && h[st.peek()] > cur) {
            int height = h[st.pop()];
            int left = st.isEmpty() ? -1 : st.peek();
            int width = i - left - 1;
            ans = Math.max(ans, height * width);
        }
        st.push(i);
    }
    return ans;
}
```

---

## Problem 3 - CF 1313C2: Skyscrapers

### Problem Statement
Choose peak and reduce heights to form mountain-like skyline maximizing total sum.

### Why This DS/Algo
Nearest-smaller boundaries and prefix contribution from monotonic stack provide best peak in O(n).

### Approach A - Brute Force (O(n^2))
Try each peak, propagate min to both sides.

### Approach B - Better (Prefix contribution + suffix contribution) (O(n), O(n))
Standard editorial method with stack dynamic sums.

### Approach C - Optimal
Better method is optimal asymptotically.

---

## Problem 4 - CF 4C: Registration System

### Problem Statement
For each username request, print `OK` if new, otherwise `name+count`.

### Why This DS/Algo
HashMap maps string to occurrence count, perfect direct indexing.

### Approach A - Brute Force list scan (O(n^2))

### Approach B - Better (HashMap) (O(n) avg)

```java
static List<String> registrationBetter(List<String> requests) {
    Map<String, Integer> cnt = new HashMap<>();
    List<String> out = new ArrayList<>();
    for (String s : requests) {
        int c = cnt.getOrDefault(s, 0);
        if (c == 0) out.add("OK");
        else out.add(s + c);
        cnt.put(s, c + 1);
    }
    return out;
}
```

### Approach C - Optimal
HashMap solution is optimal for expected complexity.

### Pattern Takeaways
- Monotonic stack compresses nearest-boundary computation to linear time.
- Composite DS design (DLL + TreeMap) appears in system-design flavored coding tasks.
