**Navigation**: [⬅ DSA Permutations & Combinations](19_DSA_Permutations_Combinations_Interview_Math.md) | [📚 Index](../00_INDEX.md) | [Next: Prefix, Prefix XOR & 2D Prefix ➡](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)

# File 20 — Bitwise Trie Interview Guide (Logic First, Code Later)

## Why This Chapter

This chapter closes the explicit gap for Bitwise Trie coverage.

Java implementation companion:

- [03_Algorithms/18_Bitwise_Trie_Java_Complete.md](../../03_Algorithms/18_Bitwise_Trie_Java_Complete.md)

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

**Challenge 1 (Trace — Who/When/What):** You process `[3, 10, 5, 25, 2]` using the Maximum XOR Bitwise Trie. After inserting all numbers and querying each, **who** produces the maximum XOR pair? **When** during the scan does the max get locked in? **What** happens at each bit level for the winning pair?

<details><summary>Answer</summary>

**Who:** The pair `(5, 25)` → `5 XOR 25 = 28` (binary: `00101 XOR 11001 = 11100`). **When:** When querying `5` against the trie that already contains `{3, 10, 25, 2}` — at bit 4 (value 16), `5`'s bit is 0, the trie has 1 (from 25) → takes opposite, contributing 16 to XOR. At bit 3 (value 8), `5`'s bit is 0, trie has 1 (from 25) → contributes 8. At bit 2 (value 4), `5`'s bit is 1, trie prefers 0 (from 25→`11001`, bit 2 = 0) → contributes 4. Total: 28. **What happens bit by bit:** Level 4: 0→prefers 1 (25 goes there) +16. Level 3: 0→prefers 1 (25 goes there) +8. Level 2: 1→prefers 0 (25 goes there) +4. Level 1: 0→prefers 1 (no opposite available, takes 0) +0. Level 0: 1→prefers 0 (25 has 1, same) +0. Total XOR = 28.

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

**Challenge 1 (Design — Who/When/What):** Array `a = [3, 10, 5, 25, 2]`. Find the maximum XOR of any subarray using Prefix XOR + Bitwise Trie. **Who** forms the maximum XOR subarray? **When** do you insert into the trie? **What** is the XOR formula?

<details><summary>Answer</summary>

**XOR formula:** `XOR(l, r) = prefixXor[r] XOR prefixXor[l-1]`. So: find `prefixXor[r] XOR prefixXor[l-1]` maximized. **Algorithm:** Start with `trie = {0}` (sentinel for empty prefix), compute prefix XOR running. For each new `prefixXor[i]`, query the trie for max XOR partner, then insert `prefixXor[i]`. **Who forms max?** The pair that maximizes the bit disagreement — for `a=[3,10,5,25,2]`: `prefixXor = [3, 9, 12, 21, 23]`. Best query: `21 XOR 0 = 21` — subarray `[3,10,5,25]`. Or `23 XOR 0 = 23` — full array. Check: `3 XOR 10 XOR 5 XOR 25 XOR 2 = 23`. **When to insert:** AFTER querying (so you don't XOR an element with itself unless that's valid), OR before (for subarrays starting at index 0 — hence the initial `trie.insert(0)`).

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

**Challenge 1 (Performance — Who/When/What):** You use a 32-bit Bitwise Trie for integers guaranteed to be ≤ 10⁶. **Who** wastes memory? **When** does reducing bit width matter? **What** is the exact node count reduction?

<details><summary>Answer</summary>

**Who wastes?** The 32-bit trie — for values ≤ 10⁶, only 20 bits are needed (`2^20 = 1,048,576 > 10^6`). **Memory:** Each Trie node has 2 child pointers. Worst case: `n` numbers × `bitWidth` nodes = `n × 32` nodes for 32-bit vs `n × 20` nodes for 20-bit — a **37.5% reduction**. For n=10⁵: saves 1.2M node objects. **When it matters:** Competitive programming memory limits (256MB), embedded systems, problems with 10⁶+ queries. **What to change in code:** `for (int bit = 19; bit >= 0; bit--)` instead of `bit = 31`. **Interview line:** "I read the constraint: max value ≤ 10⁶ → needs 20 bits. I'll use `int bit = 19` as the MSB to reduce trie depth and memory footprint by 37%."

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

**Navigation**: [⬅ DSA Permutations & Combinations](19_DSA_Permutations_Combinations_Interview_Math.md) | [📚 Index](../00_INDEX.md) | [Next: Prefix, Prefix XOR & 2D Prefix ➡](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)


---

## Reality Check

**"Bit tricks are one-liners to memorize"** ? Each derives from two identities ([04_Patterns/20, 10_Bit_Manipulation]): n & (n-1) clears the lowest set bit (power-of-two test, Kernighan popcount), n & -n isolates it (Fenwick trees) � both consequences of two's-complement borrowing. Derive-once beats memorize-twenty: knowing WHY the borrow ripples lets you reconstruct any of them and recognize when a novel problem reduces to lowest-set-bit reasoning, which is what the interview probes beyond the trick itself.

**"XOR only solves the single-number problem"** ? XOR is addition in GF(2), powering a family ([04_Patterns/20, 10_Bit]): single-number-II (per-bit mod-3 counting), the two-unique split (partition by any set bit of the combined XOR � the argument that the differing bit provably separates the pair), missing-number, parity. The two-unique trick is the depth marker because it works via an ARGUMENT, not an incantation � and reciting XOR properties without the separating-bit argument fails the follow-up.

**"The bitwise trie is an exotic curiosity"** ? The bitwise trie is the standard tool for max-XOR-pair and its relatives ([12 Trees_Graphs_Trie]): walk the bits from the most significant, greedily choosing the opposite bit to maximize XOR � the trie-walk that turns an O(n squared) pairwise comparison into O(n times bits). It fuses the trie structure (12's prefix backbone) with bit reasoning, and it is exactly the structure-combination interviewers escalate to after the basic bit tricks, not a curiosity.

**"Shifting is well-defined everywhere"** ? Java shifts mask the count to the register width ([04_Patterns/20, 10_Bit]): 1 << 32 is 1, not 0 (a genuinely surprising spec corner), and the >> vs >>> distinction (arithmetic sign-extending vs logical zero-filling) makes -1 >> 1 == -1 but -1 >>> 1 == MAX_VALUE. Any bit code computing shift amounts dynamically must bound them, and using the wrong shift on negatives produces silently-wrong results � the shipped-real-bug detail these problems drill.

**"Bitmask DP is graph problems in disguise"** ? The mask IS a visited-set compressed to an int, and the practice is the state arithmetic ([04_Patterns/20, 13_DSA_Problems_DP]): 2^n masks times n positions fits at n up to 20 (TSP, min-cost-to-visit-all), submask enumeration totals 3^n via the sub=(sub-1)&m idiom (partition problems), and mask-plus-current-node keys the shortest-path-visiting-all-nodes (dropping the extra dimension merges distinct states � the wrong-answer bug). The n-up-to-20 constraint is the flashing sign, and the visited-set-as-integer reframe is the unlock this category teaches.
