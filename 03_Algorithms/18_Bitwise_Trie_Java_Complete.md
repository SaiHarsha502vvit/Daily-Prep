> **Navigation**: [< Previous](17_DSA_Java_Implementation_Mastery.md) | [Back to Index](00_INDEX.md) | [Next >](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)

# Chapter 18 - Bitwise Trie Java Complete Guide

> Purpose: Make Bitwise Trie interview-ready in Java with deep reasoning, production-safe implementation, variants, and common pitfalls.

---

## 1. Why Bitwise Trie Exists

### The problem shape

When a question says:
- "maximum XOR"
- "best value to XOR with x"
- "count pairs with XOR constraint"

we need bit-level decisions, not value-level sorting.

### Core insight

For XOR, each bit contributes independently.
At bit position `b`:
- to maximize XOR, prefer opposite bit
- to minimize XOR, prefer same bit

Bitwise Trie stores numbers by their bit paths so each query can greedily take the best branch.

---

## 2. Mental Model (Interview Explanation)

Think of each number as a 32-step route:

bit31 -> bit30 -> ... -> bit0

Trie node has two edges:
- `next[0]`
- `next[1]`

For `x`, at each level:
- `bit = (x >>> b) & 1`
- `want = bit ^ 1` for maximum XOR
- if `want` branch exists, take it
- else take `bit` branch

### Interview script

"I model each integer as a fixed-width bit string in a binary trie. To maximize XOR with x, I greedily choose the opposite bit at each position. Since width is fixed (32), each insert/query is O(32), effectively O(1)."

---

## 3. Complexity

Let `W` be bit width (32 for `int`).

- insert: O(W)
- query max xor: O(W)
- remove (optional with counts): O(W)
- space: O(W * number_of_inserted_values) in worst case

For `n` inserts + `q` queries:
- O((n + q) * W)

Since W is constant, linear in practice.

---

## 4. Java Data Structure Design



## 4.1 Node

```java
static final class Node {
    Node[] next = new Node[2];
    int passCount; // how many numbers pass through this node
}
```

`passCount` is crucial when we support deletion or counting variants.

## 4.2 Trie Class (core API)

```java
public final class BitwiseTrie {
    private static final int MAX_BIT = 31; // signed int: bits 31..0
    private final Node root = new Node();

    public void insert(int x) {
        Node cur = root;
        cur.passCount++;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;
            if (cur.next[bit] == null) cur.next[bit] = new Node();
            cur = cur.next[bit];
            cur.passCount++;
        }
    }

    public boolean remove(int x) {
        if (!contains(x)) return false;

        Node cur = root;
        cur.passCount--;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;
            Node nxt = cur.next[bit];
            nxt.passCount--;
            if (nxt.passCount == 0) {
                cur.next[bit] = null; // prune subtree
                return true;
            }
            cur = nxt;
        }
        return true;
    }

    public boolean contains(int x) {
        Node cur = root;
        if (cur.passCount == 0) return false;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;
            cur = cur.next[bit];
            if (cur == null || cur.passCount == 0) return false;
        }
        return true;
    }

    public int maxXorWith(int x) {
        if (root.passCount == 0) return 0;

        Node cur = root;
        int ans = 0;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;
            int want = bit ^ 1;

            if (cur.next[want] != null && cur.next[want].passCount > 0) {
                ans |= (1 << b);
                cur = cur.next[want];
            } else {
                cur = cur.next[bit];
            }
        }
        return ans;
    }

    public int minXorWith(int x) {
        if (root.passCount == 0) return 0;

        Node cur = root;
        int ans = 0;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;

            if (cur.next[bit] != null && cur.next[bit].passCount > 0) {
                cur = cur.next[bit];
            } else {
                ans |= (1 << b);
                cur = cur.next[bit ^ 1];
            }
        }
        return ans;
    }

    public boolean isEmpty() {
        return root.passCount == 0;
    }
}
```

---

## 5. Classic Problem 1 - Maximum XOR of Two Numbers

### Logic first

For each number `x`:
- query max XOR against numbers already inserted
- insert `x`
- update global maximum

This avoids O(n^2) brute force.

### Java implementation

```java
public final class MaxXorTwoNumbers {
    public int findMaximumXOR(int[] nums) {
        if (nums == null || nums.length < 2) return 0;

        BitwiseTrie trie = new BitwiseTrie();
        trie.insert(nums[0]);

        int best = 0;
        for (int i = 1; i < nums.length; i++) {
            best = Math.max(best, trie.maxXorWith(nums[i]));
            trie.insert(nums[i]);
        }
        return best;
    }
}
```

---



> 🔬 **Section Challenge — 5. Classic Problem 1 - Maximum XOR of Two Numbers**
>
> **Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?
> <details><summary>Answer</summary>
>
> The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.
> </details>
>

## 6. Classic Problem 2 - Maximum XOR with Constraint (Offline)

Question style:
- array `nums`
- query `(x, m)` -> max `(x XOR y)` where `y <= m`

### Logic

Sort:
- nums ascending
- queries by `m` ascending

Maintain pointer in nums:
- insert all `nums[i] <= m` into trie
- answer query with current trie

### Java implementation

```java
import java.util.*;

public final class MaxXorWithConstraint {

    private static final class Q {
        int x, m, idx;
        Q(int x, int m, int idx) {
            this.x = x;
            this.m = m;
            this.idx = idx;
        }
    }

    public int[] maximizeXor(int[] nums, int[][] queries) {
        Arrays.sort(nums);

        Q[] qs = new Q[queries.length];
        for (int i = 0; i < queries.length; i++) {
            qs[i] = new Q(queries[i][0], queries[i][1], i);
        }
        Arrays.sort(qs, Comparator.comparingInt(a -> a.m));

        int[] ans = new int[queries.length];
        Arrays.fill(ans, -1);

        BitwiseTrie trie = new BitwiseTrie();
        int p = 0;

        for (Q q : qs) {
            while (p < nums.length && nums[p] <= q.m) {
                trie.insert(nums[p++]);
            }
            if (!trie.isEmpty()) ans[q.idx] = trie.maxXorWith(q.x);
        }

        return ans;
    }
}
```

---




## 7. Classic Problem 3 - Maximum Subarray XOR

### Formula

Let `px[i]` be prefix xor up to i.

Subarray xor `l..r` = `px[r] XOR px[l-1]`.

So for each current prefix xor `cur`:
- best subarray ending here is max xor between `cur` and previous prefix xors.

### Java implementation

```java
public final class MaxSubarrayXor {

    public int maxSubarrayXor(int[] arr) {
        BitwiseTrie trie = new BitwiseTrie();

        int px = 0;
        int best = Integer.MIN_VALUE;

        trie.insert(0); // important for subarrays starting at index 0

        for (int v : arr) {
            px ^= v;
            best = Math.max(best, trie.maxXorWith(px));
            trie.insert(px);
        }
        return best;
    }
}
```

---

## 8. Counting Variant - Pairs with XOR < K

This is advanced and uses node counts.

At each bit from high to low:
- inspect bit of `x` and `k`
- if `kBit == 1`, one branch contributes fully to count and continue on opposite branch
- if `kBit == 0`, forced to continue in same xor-bit branch

Below is a compact implementation style.

```java
public final class CountPairsXorLessThanK {

    private static final class Node {
        Node[] ch = new Node[2];
        int cnt;
    }

    private final Node root = new Node();
    private static final int MAX_BIT = 31;

    private void insert(int x) {
        Node cur = root;
        cur.cnt++;
        for (int b = MAX_BIT; b >= 0; b--) {
            int bit = (x >>> b) & 1;
            if (cur.ch[bit] == null) cur.ch[bit] = new Node();
            cur = cur.ch[bit];
            cur.cnt++;
        }
    }

    private int countLessThan(int x, int k) {
        Node cur = root;
        int count = 0;

        for (int b = MAX_BIT; b >= 0 && cur != null; b--) {
            int xb = (x >>> b) & 1;
            int kb = (k >>> b) & 1;

            if (kb == 1) {
                Node same = cur.ch[xb];
                if (same != null) count += same.cnt;
                cur = cur.ch[xb ^ 1];
            } else {
                cur = cur.ch[xb];
            }
        }
        return count;
    }

    public long countPairs(int[] nums, int k) {
        long ans = 0;
        for (int x : nums) {
            ans += countLessThan(x, k);
            insert(x);
        }
        return ans;
    }
}
```

---




## 9. Java-Specific Pitfalls and Fixes

1. Signed shift confusion
- use `>>>` for unsigned right shift when reading bits

2. Overflow in bit mask build
- keep expressions parenthesized: `(x >>> b) & 1`

3. Object overhead
- for huge data, replace node objects with array pools:
  - `int[][] next = new int[maxNodes][2]`
  - `int[] cnt = new int[maxNodes]`

4. Empty trie query
- define behavior (`0` or `-1`) and keep it consistent

5. Negative numbers
- fixed width 32-bit traversal handles them; do not shorten width unless constraints allow non-negative bounded values

---

## 10. Interview Q&A Ready Answers

Q: Why trie, not sorting?
A: Sorting helps with order by value, but XOR objective is bitwise per-position. Trie directly optimizes bit choices in O(32).

Q: Why is greedy valid here?
A: Higher bits dominate numeric value. Taking best possible higher bit first is always optimal.

Q: Complexity?
A: O(32) per insert/query, effectively O(1). Total O(n) for fixed-width integers.

Q: Can this handle constraints `y <= m`?
A: Yes, with offline sorting of queries by m and incremental inserts.

---

## 11. Practice Set

1. LeetCode 421 - Maximum XOR of Two Numbers in an Array
2. LeetCode 1707 - Maximum XOR With an Element From Array
3. Maximum Subarray XOR (classic)
4. Count pairs with XOR in range [L, R]
5. Min XOR pair in array

---

## 12. Summary

Bitwise Trie is the most reusable Java pattern for XOR optimization.

If you remember only one line:

"At each bit, pick the branch that optimizes XOR (opposite for max, same for min), using fixed-width bit trie for O(32) queries."

---

> **Navigation**: [< Previous](17_DSA_Java_Implementation_Mastery.md) | [Back to Index](00_INDEX.md) | [Next >](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)


> 🔬 **Section Challenge — 12. Summary**
>
> **Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
> <details><summary>Answer</summary>
>
> `prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
> </details>
>

