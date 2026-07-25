

---

## Reality Check

**"Segment trees are only for range sum queries"** → Segment trees support any associative operation: range sum, range minimum/maximum, range GCD, range XOR, range AND/OR, range product. The key requirement: the operation must be associative (you can combine results from sub-ranges in any order). Non-associative operations (range mode, range median) cannot use standard segment trees — they need more complex approaches (wavelet tree, merge sort tree).

**"A Fenwick tree (BIT) is simpler than a segment tree and does the same thing"** → Fenwick trees (Binary Indexed Trees) are simpler to implement and faster in practice (better cache behavior). But they support fewer operations: standard Fenwick trees handle prefix sums and point updates. Extending to range updates requires augmentation (two BITs). Segment trees natively support range updates with lazy propagation, range queries for non-invertible operations (min/max — Fenwick trees can't do range min). If you need range update + range query for min/max, use a segment tree.

**"Lazy propagation is an optimization, not a correctness issue"** → Without lazy propagation, a range update on a segment tree is O(n) — you'd visit every leaf node in the range. With lazy propagation, you push the "pending update" down only when needed, achieving O(log n) for range updates. The lazy tag is a correctness mechanism — without it, range updates produce wrong query results. The "lazy" refers to deferred computation, not optional behavior.

**"Segment trees require 4*n array space"** → A segment tree for n elements uses at most 4n space (to be safe with non-power-of-2 sizes). With 2*nextPow2(n) — exactly 2 times the next power of 2 ≥ n — you use at most 4n space. In competitive programming, allocating `4*n` is the safe rule. For n=10^5, that's 400,000 integers — fine. For production code, use a size of `2 * 2^(ceil(log2(n)))` precisely, or just use `4*n` as a constant.

**"Persistent segment trees are only for functional programming"** → Persistent segment trees keep all historical versions by path copying — each update creates a new root and shares unchanged subtrees with previous versions. Uses: range query on historical data (what was the sum on day k?), merge operations (merge two segment trees by combining corresponding nodes), offline range k-th smallest element (build prefix trees for each prefix of the array). Each update is O(log n) time and space — O(n log n) total for n updates.
