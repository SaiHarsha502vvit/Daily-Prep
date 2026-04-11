**Navigation**: [⬅ DSA Permutations & Combinations](19_DSA_Permutations_Combinations_Interview_Math.md) | [📚 Index](00_INDEX.md) | [Next: Prefix, Prefix XOR & 2D Prefix ➡](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)

# File 20 — Bitwise Trie Interview Guide (Logic First, Code Later)

## Why This Chapter

This chapter closes the explicit gap for Bitwise Trie coverage.

Java implementation companion:
- [03_Algorithms/18_Bitwise_Trie_Java_Complete.md](../03_Algorithms/18_Bitwise_Trie_Java_Complete.md)

You already had related problems (Maximum XOR), but interview prep is stronger when the pattern itself is a standalone concept with:
- plain bit-logic explanation
- decision rules
- communication templates
- then implementation details

---

## 1) Bitwise Trie in Plain Logic

A Bitwise Trie stores numbers by bits from most significant to least significant.

If we use 32-bit integers, each number becomes a path of length 32:
- at each level, bit is 0 or 1
- left child can represent 0
- right child can represent 1

So each number is inserted as:

bit31 -> bit30 -> ... -> bit0

This makes "best opposite-bit match" queries fast.

---




## 2) Why It Works for Maximum XOR

XOR truth table:
- 0 XOR 0 = 0
- 1 XOR 1 = 0
- 0 XOR 1 = 1
- 1 XOR 0 = 1

To maximize XOR at each bit position:
- if current bit is 0, we want 1
- if current bit is 1, we want 0

That is why query prefers the opposite branch first.

Interview one-liner:

"At each bit, XOR is maximized by taking the opposite bit if available; trie lets me greedily do that in O(bitWidth)."

---

## 3) When to Use Bitwise Trie vs Alternatives

Use Bitwise Trie when:
- question includes XOR optimization/matching
- many repeated queries over a changing set
- need online insertion + query

Common triggers:
- maximum XOR of two numbers
- maximize x XOR y from set S
- offline queries: max XOR under constraint
- XOR pair counting with bounds

Prefer alternatives when:
- only one pass and tiny constraints -> brute force may be acceptable
- no bitwise objective -> trie is unnecessary
- very small number range -> array/frequency tricks might be simpler

---

## 4) Core Operations (Language-Agnostic)

## 4.1 Insert(number)

For each bit from high to low:
- read bit b
- if child[b] missing, create it
- move to child[b]




## 4.2 QueryMaxXor(number)

For each bit from high to low:
- read bit b
- preferred = 1 - b
- if child[preferred] exists:
  - set answer bit to 1
  - move to child[preferred]
- else move to child[b]

Complexity:
- insert: O(W)
- query: O(W)
- W = bit width (usually 31 or 32)

Total for n numbers:
- O(nW), effectively O(n)

---

## 5) Variants You Should Know

## Variant A: Maximum XOR of Two Numbers

Flow:
1. initialize trie with first number
2. for each next number x:
- query best XOR against inserted numbers
- update global max
- insert x



🔬 **Section Challenge — Variant A: Maximum XOR of Two Numbers**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?
<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.
</details>


## Variant B: Maximum XOR with Constraint (offline)

Pattern:
- queries: (x, limit)
- sort numbers ascending
- sort queries by limit
- insert all numbers <= limit
- query trie for x

Why offline sort helps:
- each number inserted once
- each query answered once
- total near O((n+q)W + sort cost)




## Variant C: Prefix XOR + Trie (max subarray XOR)

Logic:
- subarray XOR i..j = prefixXor[j] XOR prefixXor[i-1]
- while scanning, store previous prefixXor values in trie
- for current prefixXor, query max xor partner



🔬 **Section Challenge — Variant C: Prefix XOR + Trie (max subarray XOR)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?
<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.
</details>


## Variant D: Counting XOR pairs less than K

Uses trie with count metadata in nodes.

For each number x:
- count how many previous y satisfy (x XOR y) < K
- insert x

This is a classic advanced interview extension.

---




## 6) Handling Negatives and Bit Width




## Option 1: Fixed unsigned view

Treat each int as fixed 32-bit pattern.

In Java:
- iterate bits 31..0
- use unsigned shift `>>>`

## Option 2: Bounded range optimization

If constraints guarantee smaller values (for example <= 1e6), bit width can be reduced (20 bits) to save memory.

Interview line:

"I choose bit width from constraints; for generic int I use 31/32 bits, for bounded values I compress width."

---



🔬 **Section Challenge — Option 2: Bounded range optimization**

**Challenge 1 (Reasoning):** `<T extends Comparable<T>>` vs `<T extends Comparable>` — what's the difference and why does the first form matter?
<details><summary>Answer</summary>

The raw form `<T extends Comparable>` loses type safety — compares apples to oranges at runtime. `<T extends Comparable<T>>` specifies that T can compare WITH ITSELF: `Integer.compareTo(Integer)`, not `Integer.compareTo(Object)`. This is why `Collections.sort()` uses `<T extends Comparable<? super T>>` — T can be compared using its own or a supertype's compareTo.
</details>


## 7) Common Mistakes

1. Using signed shift incorrectly
- fix: use unsigned shift where required

2. Inconsistent bit width between insert/query
- fix: one global width constant

3. Forgetting base case when trie is empty
- fix: insert first value before query or handle empty query

4. Memory blow-up in huge datasets
- fix: reduce bit width by max value constraint, or use pooled node arrays

5. Wrong objective in query
- max XOR requires opposite-bit preference
- min XOR requires same-bit preference first

---

## 8) Interview Communication Script

Use this exact flow in discussion:

1. "This is an XOR optimization problem."
2. "XOR is maximized by opposite bits at higher positions first."
3. "I will build a bitwise trie over candidate numbers."
4. "Each query greedily takes opposite bit if available."
5. "Cost per operation is O(W), W fixed (32), so near O(n)."
6. "I can extend this to constrained queries by offline sorting."

---

## 9) Language-Specific Notes (Only After Logic)

## Java details

- Node with `Node[] child = new Node[2]`
- bit extraction: `(num >>> bit) & 1`
- for many values, object overhead can be high -> consider int-index arrays for children

## Python details

- dict-based nodes are simple but slower
- list-of-two children is faster when performance matters

## C++ details

- pointer trie is common
- memory pool/vector indices often fastest

---

## 10) Minimal Pseudocode

```text
insert(x):
  node = root
  for b from W-1 down to 0:
    bit = (x >> b) & 1
    if node.child[bit] missing: create
    node = node.child[bit]

maxXor(x):
  node = root
  ans = 0
  for b from W-1 down to 0:
    bit = (x >> b) & 1
    want = 1 - bit
    if node.child[want] exists:
      ans |= (1 << b)
      node = node.child[want]
    else:
      node = node.child[bit]
  return ans
```

---




## 11) Practice Ladder

1. Maximum XOR of Two Numbers (base pattern)
2. Maximum XOR with an Element From Array (offline constrained)
3. Maximum XOR Subarray (prefix XOR + trie)
4. Count pairs with XOR in range (node counts)

---

**Navigation**: [⬅ DSA Permutations & Combinations](19_DSA_Permutations_Combinations_Interview_Math.md) | [📚 Index](00_INDEX.md) | [Next: Prefix, Prefix XOR & 2D Prefix ➡](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)
