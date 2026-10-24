# 1. Why Worst-Case Per-Op Lies — The Resize Example

> **Navigation**: [Chapter overview](../A2_DS_Complexity_FirstPrinciples.md) | [6. The Famous DS Amortized Analyses →](02_the_famous_ds_amortized_analyses.md)
> Page 1 of 2 in **A2. Data Structure Complexity — From First Principles**


Consider the canonical mutable structure: a dynamic array (Java's `ArrayList`, C++'s `vector`).

```java
public class DynamicArray<T> {
    private Object[] data;
    private int size;
    private int capacity;

    public DynamicArray() {
        data = new Object[1];
        size = 0;
        capacity = 1;
    }

    public void add(T element) {
        if (size == capacity) {
            resize(2 * capacity);   // Step 1: allocate new array
            for (int i = 0; i < size; i++)
                data[i] = oldData[i]; // Step 2: copy ALL existing elements
        }
        data[size++] = element;
    }
}
```

**Worst-case analysis asks**: What is the cost of a single `add()` call?

**Answer from worst-case**: O(n). When the array is full, `resize()` must copy n elements, which is Θ(n). Since this *can* happen, the worst-case per-operation cost of `add` is **O(n)**.

But this answer is **pathologically misleading**. The O(n) resize happens rarely. After n inserts, exactly one resize has occurred (copying n elements). After 2n inserts, exactly two resizes (copying n and 2n elements). The expensive operations are *paid for* by the cheap ones that preceded them.

Amortized analysis makes this precise. We ask: *What is the average cost per operation, over any sequence of n operations starting from a clean state?*

For the dynamic array: n inserts cost **O(n)** total, giving **O(1)** amortized per insert. The O(n) worst-case is real, but it cannot be charged to a single operation — it is the deferred cost of all the cheap insertions that triggered it.

This is the central insight of amortized DS analysis, and it applies to every mutable structure that occasionally "reorganizes" itself: hash tables that rehash, heaps that percolate, splay trees that restructure, disjoint sets that compress paths.

---

## 2. The Three Amortized Analysis Methods (DS-Flavored)

Before diving into specific structures, we formalize the three methods. All three give the same bound for a given data structure — they are different proof techniques, not different answers.

### 2.1 Aggregate Method (Summation)

**Approach**: Sum the total cost of a sequence of n operations, then divide by n.

**When to use**: When the expensive operation occurs at a known, structured frequency (e.g., resizes at powers of 2). The total cost forms a clean sum that you can evaluate.

**Formally**: Let `c_i` be the actual cost of operation `i`. We prove that for all n:

```
Σ_{i=1}^{n} c_i ≤ T(n)    (some explicit function)
```

If `T(n) = O(n)`, then amortized cost per op is `O(n)/n = O(1)`.

### 2.2 Accounting Method (Banker's)

**Approach**: Assign each operation a *charge* (amortized cost) that may be higher than its actual cost. The surplus is stored as "credit" and used to pay for future operations whose actual cost exceeds their charge.

**Invariant (Credit Invariant)**: The credit balance = (total charged) − (total actual cost) must always be ≥ 0.

**When to use**: When you can define a per-element credit that exactly covers the future work attributable to that element. Each piece of work has a clear "payer."

> [!TIP]
> **Key insight:** The charge per operation need not equal its actual cost. The charge only needs to overapproximate the cost in a way that lets credit accumulate for the rare expensive operations.

### 2.3 Potential Method (Physicist's)

**Approach**: Define a *potential function* Φ that maps each DS state D to a non-negative real number. Think of Φ(D) as the "stored energy" in the structure.

**Amortized cost** of operation i:

```
â_i = c_i + Φ(D_i) − Φ(D_{i-1}) = c_i + ΔΦ_i
```

**Total amortized cost** of n operations:

```
Σ â_i = Σ c_i + Φ(D_n) − Φ(D_0)
```

If Φ(D_0) = 0 and Φ(D_i) ≥ 0 for all i, then:

```
Σ â_i ≥ Σ c_i   (amortized is an upper bound on actual)
```

**When to use**: When you can define a global "energy" that decreases during expensive operations (paying for them) and increases during cheap ones (storing energy for later). The potential function encodes the *shape* of the data structure — depth, number of 1-bits, heap order, tree balance.

**Choosing the potential function**: This is the creative step. The potential must be:
1. Zero in the initial state
2. Non-negative in all states
3. Decrease by at most the actual cost of expensive ops (so the amortized cost bound is tight)

**Decision guide: which method?**

| Question | Method |
| -------- | ------ |
| Can you sum the total costs directly (geometric series, known frequencies)? | **Aggregate** method |
| Can you assign per-element credits that cover future work? | **Accounting** method |
| Can you define a global "energy" of the structure that increases on cheap operations (storing work for the future) and decreases on expensive operations (spending stored energy)? | **Potential** method |

---

## 3. Aggregate Method — Dynamic Array Resize

### Setup

We have an initially empty dynamic array with initial capacity 1. The `add` operation:
1. If `size < capacity`: O(1) insert.
2. If `size == capacity`: double capacity, copy all n elements to new array, then insert. Cost = Θ(n).

### Analysis

Consider n consecutive `add` operations starting from empty.

**Resize schedule**: Resizes occur when size reaches 1, 2, 4, 8, ..., 2^⌊log₂ n⌋. There are ⌊log₂ n⌋ + 1 resizes.

**Cost of each resize** (copying the current elements):
```
Resize 1: copy 1 element
Resize 2: copy 2 elements
Resize 3: copy 4 elements
...
Resize k: copy 2^{k-1} elements
```

Total resize cost for n inserts:
```
Σ_{i=0}^{⌊log₂ n⌋} 2^i  =  2^{⌊log₂ n⌋+1} − 1  <  2n − 1  =  O(n)
```

Total insert cost (the O(1) part, n times): n

**Total cost for n adds**: `O(n) + O(n) = O(n)`

**Amortized cost per operation**: `O(n) / n = O(1)` ✓

### Verification

Let n = 16. Resizes at sizes: 1, 2, 4, 8.
| Resize at size | Elements copied | Cost |
| -------------- | --------------- | ---- |
| 1 | 1 | 1 |
| 2 | 2 | 2 |
| 4 | 4 | 4 |
| 8 | 8 | 8 |
| **Total** | | 1+2+4+8 = 15 = 2·8 − 1 = **2n − 1** ✓ |

- Total insert cost (16 O(1) operations): 16
- Total: 31. Amortized: 31/16 ≈ 1.94 → **O(1)** ✓

**Why doubling (not +1)?** If capacity grew by +1 each time, there would be n resizes costing 1+2+3+...+n = Θ(n²) total, giving O(n) amortized per op. Doubling makes the geometric series converge, converting Θ(n²) total into Θ(n).

---

## 4. Accounting Method — Stack with Multipop

### 💬 Study-Partner View — Accounting Method

**1. The bottom line:** Charge each cheap operation a little extra and bank the surplus as credit, so expensive operations are already paid for.

**2. The textbook core:**

- Assign each operation an **amortized charge**; the difference from the actual cost goes to (or comes from) a credit stored on the structure.
- Rule: credit must **never go negative**.
- If total amortized charges ≥ total actual costs, the amortized charge is a valid upper bound.
- Multipop stack: charge 2 per `push` (1 pays the push, 1 prepaid for the pop); `pop` and `multipop` cost 0 amortized.

**3. The real-world analogy:** A **prepaid transit card**: you top up a bit every time you ride the bus, so when a long journey needs a big fare the balance is already there.

**4. Walkthrough:**

1. Push a, b, c: each charged 2, actual 1, so each element carries 1 credit (total 3).
2. `multipop(5)` pops 3 elements: actual cost 3, charged 0, paid by the 3 credits; balance returns to 0.
3. Total charged 6 = total actual 6 over 4 operations, so the amortized cost is 1.5 = O(1).

> [!NOTE]
> **Quick check:** What would break the argument? *If credit could go negative, we would have spent money we never collected.*


### Setup

A stack supports three operations:
- `push(x)`: O(1) actual
- `pop()`: O(1) actual
- `multipop(k)`: pops up to min(k, stack.size) elements, O(min(k, size)) actual

**Naive worst-case**: `multipop(n)` on a stack of size n costs O(n). The worst-case per-operation bound is O(n).

### Accounting Method Design

> [!TIP]
> **Key insight:** Every element, once pushed, is responsible for paying for its own eventual pop. We assign a charge to `push` that covers both the push itself and the future pop of that element.

**Charges**:
- `push(x)`: charge 2 units
  - 1 unit pays for the actual push
  - 1 unit is stored as credit, attached to the newly pushed element
- `pop()`: charge 0 units — uses the 1 credit stored on the element being popped
- `multipop(k)`: charge 0 units — uses k credits, one per element popped

### Verification of Credit Invariant

**Claim**: The credit balance is always non-negative.

**Proof by induction on operations**:

*Base*: Initially stack is empty, credit = 0 ≥ 0. ✓

*Inductive step*: Consider one operation.

- **push**: adds 1 element, adds 1 credit. Credit increases by 1. ✓
- **pop**: removes 1 element, uses 1 credit (the one attached to that element). Credit decreases by 1. Since that element was previously pushed, it contributed 1 credit. Credit cannot go negative. ✓
- **multipop(k)**: removes k elements, uses k credits (one per element). Same argument as pop, scaled by k. ✓

**Total charged** for n pushes: 2n = O(n)

**Total actual cost** for n pushes and their associated pops: at most 2n (each element pushed once and popped at most once) = O(n)

**Amortized cost per operation**: O(n) / n = O(1) ✓

### Intuition

```
Credit balance = number of elements in stack

Why? Each element carries exactly 1 stored credit.
Push:     credit += 1   (element enters with its credit)
Pop:      credit -= 1   (element leaves, takes its credit)
Multipop: credit -= k   (k elements leave, taking k credits)

The credit invariant is automatically maintained because
you cannot pop an element that was never pushed.
```

### Worked Example

Sequence: push(a), push(b), push(c), multipop(5)

| Step | Operation | Actual | Charged | Credit on stack | Balance |
| ---- | --------- | ------ | ------- | --------------- | ------- |
| 1 | `push(a)` | 1 | 2 | a→1 | 1 |
| 2 | `push(b)` | 1 | 2 | a→1, b→1 | 2 |
| 3 | `push(c)` | 1 | 2 | a→1, b→1, c→1 | 3 |
| 4 | `multipop(5)` (pops 3 elements) | 3 | 0 | credits used: 3 | 0 |

- Total charged: 2+2+2+0 = 6
- Total actual: 1+1+1+3 = 6
- Amortized per operation: 6/4 = 1.5 = **O(1)** ✓

---

## 5. Potential Method — Binary Counter, Dynamic Array Formal

### 💬 Study-Partner View — Potential Method

**1. The bottom line:** Define an "energy" for the structure; cheap operations store energy, expensive ones spend it, and the amortized cost is actual cost plus the change in energy.

**2. The textbook core:**

- Pick a potential function Φ with `Φ(D₀) = 0` and `Φ(Dᵢ) >= 0`.
- Amortized cost `â = c + Φ(Dᵢ) - Φ(Dᵢ₋₁)`.
- Then `Σ â >= Σ c`, so amortized bounds the real total.
- Binary counter: Φ = number of 1-bits; each increment has `â = 2`.

**3. The real-world analogy:** A **spring or a battery**: charging it (potential goes up) is cheap per step, and a big task that discharges it is "free" because the energy was saved earlier.

**4. Walkthrough:**

1. Counter at `011` (Φ = 2) increments to `100` (Φ = 1).
2. Actual cost c = 3 bits flipped.
3. ΔΦ = 1 - 2 = -1, so `â = 3 + (-1) = 2`.
4. Every increment has `â = 2`, so n increments cost at most 2n.

> [!NOTE]
> **Quick check:** How is it related to accounting? *Φ is the total credit stored in the structure, just expressed as one function.*


### The Binary Counter

A binary counter (k bits, counting from 0 upward) supports `increment()`:
- Scan from LSB upward, flipping 1→0 until a 0 is found
- Flip that 0→1

**Worst-case per increment**: If the counter is 011...111 (k ones), incrementing flips all k+1 bits = O(k) = O(log n) for an n-bit counter. If this happens repeatedly, naive worst-case analysis gives O(n log n) for n increments.

### Potential Function

Define: **`Φ(counter) = number of 1-bits in the counter`**

Properties:
- Φ(0...000) = 0 (initial state, satisfies Φ(D₀) = 0) ✓
- Φ(D) ≥ 0 for all states ✓
- Φ is integer-valued ✓

### Amortized Cost Computation

Consider an increment that flips the rightmost k trailing 1-bits to 0, then flips the next 0 to 1:

```
Before:  ... 0  1  1  1  (k trailing 1s)
After:   ... 1  0  0  0
          ↑ bit flipped from 0→1
```

- **Actual cost**: k (1→0 flips) + 1 (0→1 flip) = k + 1
- **ΔΦ**: The counter gains 1 new 1-bit (the flipped MSB 0→1) and loses k 1-bits (the k trailing 1s). So ΔΦ = 1 − k.
- **Amortized cost**: `â = c + ΔΦ = (k+1) + (1−k) = 2`

### Total Cost

For n increments: `Σ â_i = 2n = O(n)`

Amortized cost per increment: `O(n)/n = O(1)` ✓

### Verification for Key Sequences

Counting 000 → 001 → 010 → 011 → 100, with Φ = number of 1-bits:

| Increment | Bit pattern | c (bits flipped) | Φ before → after | ΔΦ | â = c + ΔΦ |
| --------- | ----------- | ---------------- | ---------------- | -- | ---------- |
| 0 → 1 | 000 → 001 | 1 | 0 → 1 | +1 | 2 |
| 1 → 2 | 001 → 010 | 2 | 1 → 1 | 0 | 2 |
| 2 → 3 | 010 → 011 | 1 | 1 → 2 | +1 | 2 |
| 3 → 4 | 011 → 100 | 3 | 2 → 1 | −1 | 2 |

Σ c = 1+2+1+3 = **7** (actual cost), Σ â = 2+2+2+2 = **8** ≥ 7 ✓. The bound holds, and every increment is charged exactly 2.

**Important**: The amortized cost bound is **O(1)** — not necessarily 2. For larger sequences, k can be up to log₂ n, but `â = 2` always holds by the algebra above. The bound is tight because a counter at 0 has `â = 2` (k = 0 trailing 1s: c=1, ΔΦ=+1, â=2).

---

### Formal Potential for Dynamic Array (Potential Method)

Now re-prove the dynamic array bound using potential. This formalizes Section 3 with the physicist's method, demonstrating the equivalence of all three approaches.

**State**: The state D_i is the array after i insertions.

**Potential function**: `Φ(D) = 2·size − capacity` when size = capacity, and `Φ(D) = 0` otherwise.

*Intuition*: When the array is full (size = capacity), Φ > 0. The positive potential represents "stored energy" that will be spent on the upcoming resize.

**Analysis of `add`**:

*Case 1 — No resize* (size < capacity before insertion):
- Actual cost: 1 (write element)
- After insertion: size increases by 1, capacity unchanged
- ΔΦ: size was < capacity, so Φ was 0. After: size+1 could equal capacity? If size+1 = capacity, then Φ becomes 2·capacity − capacity = capacity > 0.
- We need `Φ(final) − Φ(initial)`. Case analysis:

If `size < capacity − 1` before: Φ stays 0. After insert: size' = size+1 < capacity, Φ stays 0. ΔΦ = 0. `â = 1 + 0 = 1`.

If `size = capacity − 1` before: Φ = 0 (size ≠ capacity). After insert: size' = capacity, so Φ' = 2·capacity − capacity = capacity. ΔΦ = capacity. `â = 1 + capacity = O(n)` — but this case is the resize case, handled below.

*Case 2 — Resize* (size = capacity before insertion, must double):
- Actual cost: capacity (copying all elements) + 1 (inserting new element) = capacity + 1
- After resize: capacity' = 2·capacity, size' = capacity + 1
- Φ' = 0 (size' < capacity')
- ΔΦ = 0 − Φ, where Φ = 2·capacity − capacity = capacity
- So ΔΦ = −capacity
- `â = (capacity + 1) + (−capacity) = 1`

**Result**: Whether or not a resize occurs, `â = O(1)`. For n inserts, total amortized = O(n), amortized per op = O(1) ✓.

---

[Chapter overview](../A2_DS_Complexity_FirstPrinciples.md) | [6. The Famous DS Amortized Analyses →](02_the_famous_ds_amortized_analyses.md)
