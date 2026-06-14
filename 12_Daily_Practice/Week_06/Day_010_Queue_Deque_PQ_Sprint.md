# Day 10 - Queue, Deque, and Priority Queue (Reasoning-First Notes)

## Daily Problem Set

1. LeetCode Premium: 353 - Design Snake Game
2. LeetCode Hard: 239 - Sliding Window Maximum
3. Codeforces: 1303D - Fill The Bag
4. Codeforces: 977C - Less or Equal

## Problem Links

- LC 353 (Premium): Locked on LeetCode (no public official statement page)
- LC 239: https://leetcode.com/problems/sliding-window-maximum/
- CF 1303D: https://codeforces.com/problemset/problem/1303/D
- CF 977C: https://codeforces.com/problemset/problem/977/C

## Why This Day Matters

This day teaches data-structure choice by operation profile: FIFO queue, monotonic deque, and max/min retrieval under updates.

---

## Problem 1 - LC 353 (Premium): Design Snake Game

### Problem Statement

Implement snake game with moves `U,D,L,R`. Return score or `-1` when game over.

### Why This DS/Algo

- Need O(1) head insertion and tail deletion: deque.
- Need O(1) collision check: hash set of occupied cells.

### Approach A - Brute Force board scan (O(mn) move)

Maintain full board and scan for collision each move.

### Approach B - Better (Deque + HashSet) (O(1) avg move)

```java
class SnakeGameBetter {
    private final int w, h;
    private final int[][] food;
    private int f = 0;
    private final Deque<Integer> body = new ArrayDeque<>();
    private final Set<Integer> occ = new HashSet<>();

    SnakeGameBetter(int width, int height, int[][] food) {
        this.w = width; this.h = height; this.food = food;
        body.addFirst(0);
        occ.add(0);
    }

    public int move(String d) {
        int head = body.peekFirst();
        int r = head / w, c = head % w;
        if (d.equals("U")) r--;
        else if (d.equals("D")) r++;
        else if (d.equals("L")) c--;
        else c++;

        if (r < 0 || r >= h || c < 0 || c >= w) return -1;
        int nh = r * w + c;

        int tail = body.peekLast();
        occ.remove(tail);
        if (occ.contains(nh)) return -1;

        body.addFirst(nh);
        occ.add(nh);

        if (f < food.length && r == food[f][0] && c == food[f][1]) {
            f++;
            body.addLast(tail);
            occ.add(tail);
        } else {
            body.pollLast();
        }
        return f;
    }
}
```

### Approach C - Optimal

This O(1)-per-move design is asymptotically optimal.

---

## Problem 2 - LC 239: Sliding Window Maximum

### Problem Statement

For each window of size `k`, return maximum value.

### Why This DS/Algo

- Need max over sliding window with insert-right/remove-left.
- Monotonic deque stores candidate indices in decreasing values.

### Approach A - Brute Force (O(nk), O(1))

### Approach B - Better (PriorityQueue with lazy deletion) (O(n log k), O(k))

```java
static int[] maxWindowBetter(int[] a, int k) {
    int n = a.length;
    int[] ans = new int[n - k + 1];
    PriorityQueue<int[]> pq = new PriorityQueue<>((x, y) -> y[0] - x[0]);

    for (int i = 0; i < n; i++) {
        pq.offer(new int[]{a[i], i});
        while (pq.peek()[1] <= i - k) pq.poll();
        if (i >= k - 1) ans[i - k + 1] = pq.peek()[0];
    }
    return ans;
}
```

### Approach C - Optimal (Monotonic Deque) (O(n), O(k))

```java
static int[] maxWindowOptimal(int[] a, int k) {
    int n = a.length;
    int[] ans = new int[n - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) ans[i - k + 1] = a[dq.peekFirst()];
    }
    return ans;
}
```

### Interview Notes

Deque invariant: values are decreasing from front to back, so front is maximum.

---

## Problem 3 - CF 1303D: Fill The Bag

### Problem Statement

Given powers-of-two pieces, minimum splits needed to make sum exactly `n`.

### Why This DS/Algo

- Pieces are powers of two, so binary representation and greedy carry/split logic is natural.

### Approach A - Brute Force BFS over states

State explosion.

### Approach B - Better (Count by bit + greedy split) (O(log MAX), O(log MAX))

```java
static long fillBagBetter(long n, long[] pieces) {
    long[] cnt = new long[61];
    for (long x : pieces) cnt[Long.numberOfTrailingZeros(x)]++;

    long ans = 0;
    for (int bit = 0; bit < 60; bit++) {
        if (((n >> bit) & 1L) == 1) {
            if (cnt[bit] > 0) cnt[bit]--;
            else {
                int j = bit + 1;
                while (j < 61 && cnt[j] == 0) j++;
                if (j == 61) return -1;
                while (j > bit) {
                    cnt[j]--;
                    cnt[j - 1] += 2;
                    ans++;
                    j--;
                }
                cnt[bit]--;
            }
        }
        cnt[bit + 1] += cnt[bit] / 2;
    }
    return ans;
}
```

### Approach C - Optimal

Bit-count greedy is standard optimal strategy for this constraint.

---

## Problem 4 - CF 977C: Less or Equal

### Problem Statement

Find integer `x` such that exactly `k` elements are `<= x`; else output `-1`.

### Why This DS/Algo

Sort and inspect boundary between k-th and (k+1)-th elements.

### Approach A - Brute Force test many x values

Inefficient and unnecessary.

### Approach B - Better (Sort + boundary logic) (O(n log n), O(1))

```java
static int lessOrEqualBetter(int[] a, int k) {
    Arrays.sort(a);
    int n = a.length;
    if (k == 0) return a[0] == 1 ? -1 : 1;
    int x = a[k - 1];
    if (k < n && a[k] == x) return -1;
    return x;
}
```

### Approach C - Optimal

Sort-based boundary check is optimal with arbitrary values.

### Pattern Takeaways

- Monotonic deque solves sliding max/min in linear time.
- Bitwise greedy appears often when numbers are powers of two.
