# Interval Problems

> **Navigation**: [← Greedy](13_Greedy.md) | [Chapter index](00_INDEX.md) | [Dynamic Programming →](11_Dynamic_Programming.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Intervals pattern](../04_Patterns_Templates/21_Intervals_Pattern.md), [Sorting](20_Sorting.md), [Greedy](13_Greedy.md) |
| **You will learn** | Merge, insert, count overlaps, remove the fewest intervals, shoot balloons with the fewest arrows and intersect two interval lists |
| **Leads to** | [Dynamic Programming](11_Dynamic_Programming.md), [Heap problems](16_Heap.md) (meeting rooms with a heap) |
| **Abstraction level** | Pairwise overlap checks → **sort once, then sweep** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Interval Problems

### 1. The bottom line

Sort the intervals by start (or end) and decide each interval against the previous one in a single pass.

### 2. The textbook core

- Two intervals `[a,b]` and `[c,d]` overlap iff `a ≤ d` and `c ≤ b`.
- Merge: sort by start, extend the current interval while the next one starts inside it.
- Maximum compatible set / minimum removals: sort by **end**, keep the interval that ends first.
- Minimum rooms = maximum number of simultaneous intervals (sort starts and ends separately).
- Two sorted lists intersect with two pointers; advance the one that ends first.

### 3. The real-world analogy

A **calendar**: line up meetings by start time and walk down the day.

### 4. Walkthrough

1. Merge `[[1,3],[2,6],[8,10],[15,18]]`.
2. Sort by start (already sorted).
3. `[1,3]` and `[2,6]` overlap → `[1,6]`.
4. `[8,10]` and `[15,18]` do not overlap, so they stay.

> [!NOTE]
> **Quick check:** Why sort by end time for "keep the most non-overlapping intervals"? *The interval that finishes first leaves the most room for the rest.*


### 5. Check yourself

**Q1.** Merge `[[1,4],[4,5]]`.

<details><summary>Answer</summary>

`[[1,5]]`: touching intervals merge when the next start is ≤ the current end.

</details>

**Q2.** Minimum rooms for `[[0,30],[5,10],[15,20]]`?

<details><summary>Answer</summary>

**2**.

</details>

---

## 🗺️ Pattern Recognition Header

| Signal in the problem | Technique |
| --- | --- |
| "merge overlapping ranges" | Sort by start, extend |
| "insert into a sorted list" | Three-phase scan |
| "minimum rooms / maximum simultaneous" | Sort starts and ends, sweep |
| "fewest removals so none overlap" | Sort by end, keep greedily |
| "fewest points/arrows to hit all ranges" | Sort by end, shoot at the end |
| "intersect two sorted interval lists" | Two pointers |

> [!TIP]
> Decide at the start whether touching endpoints (`[1,2]` and `[2,3]`) count as overlapping for *this* problem; the answer changes between merge (usually yes) and meeting rooms (usually no).

---

## Problem 1 — Merge Intervals

**Task.** Given intervals, merge all overlapping ones.

**Brute force.** Repeatedly compare every pair and merge until nothing changes: `O(n²)` or worse.

**Better idea.** Sort by start; keep a current interval and extend its end while the next start is not past it.

```java
static int[][] merge(int[][] iv) {
    if (iv.length == 0) return new int[0][];
    int[][] a = iv.clone();
    Arrays.sort(a, (x, y) -> Integer.compare(x[0], y[0]));
    List<int[]> out = new ArrayList<>();
    int[] cur = a[0].clone();
    for (int i = 1; i < a.length; i++) {
        if (a[i][0] <= cur[1]) cur[1] = Math.max(cur[1], a[i][1]);
        else {
            out.add(cur);
            cur = a[i].clone();
        }
    }
    out.add(cur);
    return out.toArray(new int[0][]);
}
```

**Example.** `[[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`.

**Complexity.** `O(n log n)` time, `O(n)` space.


## Problem 2 — Insert Interval

**Task.** Insert one interval into a sorted, non-overlapping list and merge as needed.

**Brute force.** Append and run Problem 1: `O(n log n)`.

**Better idea.** Copy intervals that end before the new one starts, merge all that overlap it, then copy the rest — one pass.

```java
static int[][] insert(int[][] sorted, int[] ni) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = sorted.length;
    int[] cur = ni.clone();
    while (i < n && sorted[i][1] < cur[0]) out.add(sorted[i++]);
    while (i < n && sorted[i][0] <= cur[1]) {
        cur[0] = Math.min(cur[0], sorted[i][0]);
        cur[1] = Math.max(cur[1], sorted[i][1]);
        i++;
    }
    out.add(cur);
    while (i < n) out.add(sorted[i++]);
    return out.toArray(new int[0][]);
}
```

**Example.** `[[1,3],[6,9]]` + `[2,5]` → `[[1,5],[6,9]]`.

**Complexity.** `O(n)`.


## Problem 3 — Minimum Meeting Rooms

**Task.** Given meeting intervals `[start, end)`, find the fewest rooms needed.

**Brute force.** For every time point count the meetings covering it: `O(n · range)`.

**Better idea.** Sort starts and ends separately; a start before the earliest end needs a new room, otherwise a room frees up.

```java
static int minRooms(int[][] iv) {
    int n = iv.length;
    int[] s = new int[n], e = new int[n];
    for (int i = 0; i < n; i++) {
        s[i] = iv[i][0];
        e[i] = iv[i][1];
    }
    Arrays.sort(s);
    Arrays.sort(e);
    int rooms = 0, best = 0, j = 0;
    for (int i = 0; i < n; i++) {
        while (j < n && e[j] <= s[i]) {
            j++;
            rooms--;
        }
        rooms++;
        best = Math.max(best, rooms);
    }
    return best;
}
```

**Example.** `[[0,30],[5,10],[15,20]]` → `2`.

**Complexity.** `O(n log n)`.


## Problem 4 — Minimum Removals for Non-Overlapping

**Task.** Remove the fewest intervals so the rest do not overlap (touching is allowed).

**Brute force.** Try every subset: `O(2ⁿ)`.

**Better idea.** Maximise the kept set: sort by end and keep an interval if it starts at or after the last kept end.

```java
static int minRemovals(int[][] iv) {
// keep max non-overlapping, touching allowed
    if (iv.length == 0) return 0;
    int[][] a = iv.clone();
    Arrays.sort(a, (x, y) -> Integer.compare(x[1], y[1]));
    int keep = 1, end = a[0][1];
    for (int i = 1; i < a.length; i++) if (a[i][0] >= end) {
        keep++;
        end = a[i][1];
    }
    return iv.length - keep;
}
```

**Example.** `[[1,2],[2,3],[3,4],[1,3]]` → `1`.

**Complexity.** `O(n log n)`.


## Problem 5 — Minimum Arrows to Burst Balloons

**Task.** Each balloon is an interval on the x-axis; an arrow at `x` bursts every balloon containing `x`. Find the fewest arrows.

**Brute force.** Try every set of arrow positions: exponential.

**Better idea.** Sort by end; shoot at the end of the first balloon, skip every balloon it hits, repeat.

```java
static int minArrows(int[][] pts) {
    if (pts.length == 0) return 0;
    int[][] a = pts.clone();
    Arrays.sort(a, (x, y) -> Integer.compare(x[1], y[1]));
    int arrows = 1, end = a[0][1];
    for (int i = 1; i < a.length; i++) if (a[i][0] > end) {
        arrows++;
        end = a[i][1];
    }
    return arrows;
}
```

**Example.** `[[10,16],[2,8],[1,6],[7,12]]` → `2`.

**Complexity.** `O(n log n)`.


## Problem 6 — Interval List Intersections

**Task.** Given two lists of disjoint, sorted intervals, return their intersections.

**Brute force.** Compare every pair: `O(n·m)`.

**Better idea.** Two pointers: the overlap of the current pair is `[max(starts), min(ends)]`; advance the one that ends first.

```java
static int[][] intersections(int[][] A, int[][] B) {
    List<int[]> out = new ArrayList<>();
    int i = 0, j = 0;
    while (i < A.length && j < B.length) {
        int lo = Math.max(A[i][0], B[j][0]), hi = Math.min(A[i][1], B[j][1]);
        if (lo <= hi) out.add(new int[]{lo, hi});
        if (A[i][1] < B[j][1]) i++;
        else j++;
    }
    return out.toArray(new int[0][]);
}
```

**Example.** `[[0,2],[5,10],[13,23],[24,25]]` and `[[1,5],[8,12],[15,24],[25,26]]` → `[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]`.

**Complexity.** `O(n + m)`.

---

## 🏢 Enterprise Lens — Interval Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Calendar and booking systems, resource allocation, genomic ranges, log-window merging |
| **Failure modes** | Treating touching endpoints inconsistently (`<` versus `<=`); sorting by the wrong key; mutating input arrays |
| **Testing and verification** | Compare with a brute force that marks covered points on a number line, and with a subset enumeration for the greedy problems (1 500 random cases here) |

---

## Reality Check

> [!CAUTION]
> "Interval problems are all greedy." They are all *sort first*; whether the scan is greedy (removals), a sweep (rooms) or a merge depends on the question.

---

[← Interval Problems](25_Problem_Origins.md) | [Index](00_INDEX.md) | [Union-Find Problems →](27_Union_Find_Problems.md)
