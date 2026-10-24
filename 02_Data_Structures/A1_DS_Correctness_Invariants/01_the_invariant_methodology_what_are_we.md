# 1. The Invariant Methodology — What Are We Proving?

> **Navigation**: [Chapter overview](../A1_DS_Correctness_Invariants.md) | [6. BSTs — BST Property + Balance Invariant… →](02_bsts_bst_property_balance_invariant_avl.md)
> Page 1 of 2 in **A1. Data Structure Correctness — Proving Invariants Hold**


## Structural Invariant vs. Operational Invariant

An **algorithm** correctness proof concerns *state transitions*: starting from a precondition, after each step the algorithm's state satisfies some invariant, and upon termination the invariant implies the output is correct (loop invariant — Init / Maintenance / Termination). This is the subject of `03_Algorithms/A1_Correctness_Proofs.md`.

A **data structure** correctness proof concerns *structural preservation*: the data structure begins life in a valid state, and every mutator operation (insert, delete, resize, rotate) must transform the state while preserving the defining invariant. The proof has a different shape:

| Step | What you must show |
| ---- | ------------------ |
| **Initialization** | The constructor builds an empty or initial DS that satisfies the invariant. |
| **Preservation** (maintenance) | Every mutator (insert/delete/update/rotate/resize) preserves the invariant, proved by case analysis. |
| **Correctness** (termination) | If the invariant holds, every query operation returns the correct answer (by structural induction). |

The two invariants differ:

- **Structural (or representation) invariant** — a property of the *physical layout* of the data structure (e.g., `data[0..size-1]` contains live elements). It never depends on inputs; it is about internal consistency.
- **Operational (or abstraction) invariant** — a property guaranteed by the data structure's *abstraction* (e.g., the stack always returns the most-recently pushed element on pop). This connects the internal representation to the logical contract.

## Why This Differs from Algorithm Correctness

| Dimension          | Algorithm Proof                          | Data Structure Proof                      |
| ------------------ | ---------------------------------------- | ----------------------------------------- |
| What changes       | Execution state (variables, memory)      | Memory layout / pointer graph             |
| What is invariant  | A predicate on execution progress        | A predicate on the structural state       |
| Termination        | Loop ends → extract answer               | Every operation ends → structural check   |
| Induction base     | Before first loop iteration              | After constructor / before first mutator  |
| Induction step     | One loop iteration preserves invariant   | One mutator preserves invariant           |
| Result extraction  | Invariant + loop condition → answer      | Invariant + query algorithm → answer      |

## The Pattern: Induction on Operation Count

Let `P(k)` be the predicate: "After executing any sequence of `k` mutators on an initially-valid data structure, the invariant holds." We prove:

1. **Base case** `P(0)`: The constructor creates a structure that satisfies the invariant.
2. **Inductive step**: Assume `P(k)` holds (after `k` operations the structure is valid). Consider operation `k+1`. Show by case analysis that this operation transforms a valid structure into another valid structure — i.e., `P(k)` implies `P(k+1)`.
3. **Conclusion**: By induction, the invariant holds after any number of operations.

This is structurally identical to proving a loop invariant, but the "loop" is the sequence of mutator calls and the "iteration" is a single mutator. The critical difference is that the state being reasoned about is a *graph of memory cells*, not a set of scalar variables.

## What Each Section Does

Each section below follows the same three-part pattern:

1. **Invariant Statement** — precisely define the property (written in formal English and/or Java).
2. **Mutator Preservation** — prove each mutator (insert, delete, resize, rotate, rebalance) preserves the invariant. Where relevant, prove the auxiliary lemmas (e.g., rotation preserves BST property).
3. **Operational Correctness** — prove that because the invariant holds, query operations (`get`, `search`, `extract-min`, `find`) return correct results.

---

## 2. Arrays — Contiguous Layout Invariant

### 💬 Study-Partner View — Array Invariants

**1. The bottom line:** An array stays correct as long as the used slots are exactly the first `size` slots and every index you touch is in range.

**2. The textbook core:**

- Layout invariant: element `i` lives at `base + i × elementSize`.
- Dynamic array invariant: `0 <= size <= capacity` and elements occupy indices `0..size-1` with no gaps.
- Preservation: `add` writes at `size` then increments; `remove(i)` shifts `i+1..size-1` left then decrements `size`.
- Bounds invariant: every access satisfies `0 <= i < size` (or `< length` for a plain array).

**3. The real-world analogy:** A **row of numbered seats in a theatre**: seats are filled from the left with no empty seat in between, and a ticket number always names exactly one seat.

**4. Walkthrough:**

1. Start `size = 0`, `capacity = 4` (invariant holds trivially).
2. `add(x)` four times → `size = 4 = capacity`; the invariant still holds.
3. The fifth `add` first allocates capacity 8 and copies indices `0..3` to the same indices, so the invariant holds on the new array.
4. Then it writes at index 4 and sets `size = 5`: elements are still `0..4` with no gaps.

> [!NOTE]
> **Quick check:** What breaks if `remove` forgets to decrement `size`? *The "no stale element" part of the invariant fails and old data stays visible.*


### Invariant Statement

For a resizable array `data` with logical size field `size`:

> **Invariant (Array Layout):** `data[0..size-1]` stores exactly the live elements of the collection, in insertion order. Positions `data[size..capacity-1]` are unused scratch space. No `null` values exist among `data[0..size-1]`.

Formally: for all `i` such that `0 ≤ i < size`, `data[i]` is defined and non-null. For all `i` such that `size ≤ i < capacity`, `data[i]` may be anything.

### Initialization

The constructor `ArrayList()` creates `data = new Object[16]`, `size = 0`. Trivially, the empty range `data[0..-1]` is valid. ✓

### Mutator Preservation — `add(e)`

```java
public void add(E e) {
    if (size == data.length) resize(data.length * 2);
    data[size++] = e;
}
```

**Case 1 — No resize needed (`size < data.length`):**

`data[size]` is in the unused region `data[size..capacity-1]`. The write `data[size] = e` assigns a defined value to the first unused slot. After `size++`, `data[0..size-1]` contains all elements in order; the unused region is now `data[size..capacity-1]`. Invariant holds. ✓

**Case 2 — Resize triggered (`size == data.length`):**

Resize creates a new array `newData` of length `2 * capacity`. Then it copies `data[i]` to `newData[i]` for all `i < size`. After copying, `newData[0..size-1]` contains exactly the live elements in order (induction on the copy loop). The `e` is placed at `newData[size]`. After `size++`, `newData[0..size-1]` contains all elements. The invariant holds for the new array. ✓

### Mutator Preservation — `remove(index)`

```java
public E remove(int index) {
    E removed = (E) data[index];
    System.arraycopy(data, index + 1, data, index, size - index - 1);
    data[--size] = null;   // avoid memory leak
    return removed;
}
```

The `System.arraycopy` shifts `data[index+1..size-1]` left by one position, so after the copy:

- `data[0..index-1]` unchanged — still correct.
- `data[index]` now holds what `data[index+1]` held — the element after the removed one.
- `data[index+1..size-2]` now hold `data[index+2..size-1]`.
- `data[size-1]` is set to `null` — removed from the live range.

After `--size`, the live range is `data[0..size-1]`, which now contains exactly the original elements except the removed one. The invariant holds. ✓

### Operational Correctness — `get(index)`

Because `data[0..size-1]` is exactly the element sequence, `get(i)` returns `data[i]`, which is the `i`th inserted element. No false positives; no skipped elements. ✓

### Why the Invariant Matters

Without the layout invariant, an `ArrayList` could develop "holes" (nulls in the live range) or "leaks" (old data beyond `size`). `get(0)` might return stale data, `size` would no longer equal the true element count, and `iterator.remove()` could corrupt the structure. The invariant is what makes the array a list, not just a blob of memory.

---

## 3. Linked Lists — Reachability, Acyclicity, Order

### 💬 Study-Partner View — Linked-List Invariants

**1. The bottom line:** A linked list is correct when every node can be reached from the head, nothing loops back (unless it should), and the order is the one you intend.

**2. The textbook core:**

- **Reachability:** every live node is reachable from `head` by following `next`.
- **Acyclicity:** no node appears twice on the path from `head` to `null` (for non-circular lists).
- **Order:** `head`, `head.next`, ... is the logical sequence; `tail.next == null` and `size` equals the node count.
- Every mutator (insert/delete) must re-link in an order that never loses a node.

**3. The real-world analogy:** A **chain of paper clips**: if you unhook the middle clip without first holding the clip after it, the rest of the chain falls on the floor (a memory leak).

**4. Walkthrough:**

1. Delete `B` from `A → B → C`.
2. Save `C = B.next` first (so `C` stays reachable).
3. Set `A.next = C`.
4. Reachability holds (`A → C`), acyclicity holds, size decreases by 1; `B` is no longer reachable and can be freed.

> [!NOTE]
> **Quick check:** Which invariant does the fast/slow pointer test check? *Acyclicity.*


### Invariant Statement

For a singly linked list with `head` pointer:

> **Invariant (Singly Linked List):** Every node reachable from `head` by following `next` pointers is a live element. The terminal node's `next` is `null`. No node appears in more than one chain. The `size` field equals the number of reachable nodes.

For a doubly linked list with `head` and `tail`:

> **Invariant (Doubly Linked List):** Every node reachable from `head` has `prev` pointing to its predecessor (or `null` for the head). Every node reachable from `tail` has `next` pointing to its successor (or `null` for the tail). The `size` field equals the number of nodes in the chain. No node has both `prev == null` and `next == null` unless it is the sole node.

### Initialization

Constructor sets `head = null`, `size = 0`. The empty set of reachable nodes vacuously satisfies the invariant: there is no node to violate reachability, acyclicity, or order. ✓

### Mutator Preservation — `addFirst(e)` on a singly linked list

```java
public void addFirst(E e) {
    Node n = new Node(e);
    n.next = head;
    head = n;
    size++;
}
```

**Reachability**: Before insertion, the reachable set is exactly `{ nodes reachable from head }`. After `n.next = head`, the chain is `n → old_head → ...`. All nodes formerly reachable remain reachable (by going through `n`). Node `n` is reachable from `head` (the new head). No other nodes are affected. ✓

**Acyclicity**: The only new `next` pointer is `n.next = head`. Since `head` was already in the chain (or `null`), `n` cannot point into a node already reachable from `n` (that would create a cycle). This is because we assigned `n.next` to a node that was not reachable from `n` before the assignment. ✓

**Size**: `size++` correctly reflects the addition of one node. ✓

### Mutator Preservation — `removeFirst()`

```java
public E removeFirst() {
    E result = head.element;
    head = head.next;
    size--;
    return result;
}
```

After `head = head.next`, the chain starting at the new `head` contains all formerly reachable nodes except the old head. The removed node is no longer reachable from `head`. Size is decremented. ✓

### Acyclicity Proof — Floyd's Tortoise-and-Hare for Cycle Detection

The invariant that the list is acyclic is worth proving explicitly, because client code can break it (e.g., if `next` is mutated directly):

> **Lemma**: If the list was acyclic at the end of the last mutator, and no mutator directly creates a cycle, the list remains acyclic.

**Proof**: Consider the singly linked list as a directed graph where each node is a vertex and the `next` pointers are directed edges. A cycle exists iff there is a path `v₀ → v₁ → ... → vₖ → v₀`. The only mutator that creates edges is `addFirst`, which creates exactly one edge `n → old_head`. If `old_head` were reachable from `n` before the link, a cycle would be created. `n` is a fresh node with no outgoing edges before linking, so `old_head` cannot be reachable from `n`. Therefore no cycle is created. ✓

The Floyd cycle detection algorithm can *detect* an existing cycle in O(n) time: run a slow pointer (1 step) and a fast pointer (2 steps) from `head`. If they meet, a cycle exists. If fast reaches `null`, the list is acyclic.

### Doubly Linked List — Mutual Consistency Proof

> **Lemma (Bidirectional Consistency)**: In a doubly linked list, `node.next.prev == node` for every non-tail node, and `node.prev.next == node` for every non-head node.

**Proof by induction on the sequence of operations**: Base case — empty list has no node pairs to check. Inductive step: `addFirst(n)`: set `n.next = head` (null or old_head). If `head != null`, set `old_head.prev = n`. Set `n.prev = null`, `head = n`. After the link, `n.next` is old_head (or null), and if old_head exists, `old_head.prev` is `n`. The invariants hold for all affected pairs. Other pairs are unchanged. ✓

Similar reasoning applies to `removeFirst`, `addLast`, and `removeLast` — each operation updates at most four pointer fields, and each update preserves the bidirectional invariant.

### Size Field Consistency

> **Invariant**: `size` equals the number of nodes reachable from `head`.

**Proof**: Base case: `size = 0`, no nodes reachable. ✓ Inductive step: every mutator that adds a node increments `size`; every mutator that removes a node decrements `size`. No other operation changes `size`. By induction, the equality holds after any sequence of operations. ✓

### Operational Correctness — `get(index)`

Traversing `index` steps from `head` follows exactly the `index`-th node in the chain. Because the invariant guarantees that all reachable nodes are live elements in order, `get(i)` returns the `i`th inserted element. ✓

---

## 4. Stacks & Queues — Capacity, Order Discipline

### 💬 Study-Partner View — Stack & Queue Invariants

**1. The bottom line:** A stack is correct if only the top moves, and a queue is correct if elements leave in exactly the order they arrived.

**2. The textbook core:**

- Stack: `0 <= size <= capacity`; `top` is the last pushed element; `pop` returns the most recent push still present.
- Queue (circular array): `0 <= size <= capacity`; `front` and `rear` are indices modulo `capacity`; dequeue order = enqueue order.
- Empty vs full must be distinguishable (use `size`, or leave one slot empty).
- Every operation is O(1) because only an end index changes.

**3. The real-world analogy:** A **stack of plates** (only the top plate is touched) and a **supermarket line** (people leave in arrival order).

**4. Walkthrough:**

1. Circular queue, capacity 3: enqueue A, B, C → `size = 3` (full).
2. Dequeue → A leaves, `front` moves from 0 to 1, `size = 2`.
3. Enqueue D → written at `rear = (rear + 1) % 3 = 0` (wrap), `size = 3`.
4. Order of leaving remains B, C, D: FIFO is preserved.

> [!NOTE]
> **Quick check:** How can `front == rear` mean both empty and full? *It can, which is why a size counter (or a spare slot) is part of the invariant.*


### Stack Invariant Statement

> **Invariant (Stack)**: The top of the stack is always the most recently pushed element that has not yet been popped. The stack contents below `top` are exactly the elements pushed in LIFO order, with the bottom being the oldest unpopped element. `size ≤ capacity` at all times.

### Stack Mutator Preservation — `push(e)`

```java
public void push(E e) {
    if (size == capacity) resize(capacity * 2);
    data[size++] = e;
}
```

The array layout invariant from Section 2 guarantees `data[0..size-1]` are the live elements. By construction, `data[size]` is the first unused slot. Writing `e` there and incrementing `size` makes `e` the new top. Since `e` was pushed most recently, it is at the top — the LIFO discipline holds. ✓

### Stack Mutator Preservation — `pop()`

```java
public E pop() {
    E top = data[--size];
    data[size] = null;   // avoid memory leak
    return top;
}
```

After `--size`, the live range is `data[0..size-1]`. The element at `data[size]` (old top) is removed. The new top is `data[size-1]`, which was the second-most-recently pushed unpopped element. LIFO discipline holds. ✓

### Queue Invariant Statement

For an array-backed circular queue:

> **Invariant (Circular Queue)**: `head` points to the oldest element; `tail` points to the slot where the next element will be inserted. Elements in `data[head..tail-1]` (wrapping around modulo `capacity`) appear in FIFO order. The queue is empty when `head == tail`. The queue is full when `(tail + 1) % capacity == head`.

### The `head == tail` Ambiguity — Proving the Invariant Resolves It

The classic design choice: with a fixed-capacity circular buffer, `(head == tail)` is used to mean "empty." This means one slot is always reserved (the queue can hold at most `capacity - 1` elements). The proof:

- **Why reserve one slot**: If `head == tail` were allowed to mean both empty and full, every operation would need extra state to distinguish. The design choice is to sacrifice one slot and guarantee unambiguous state.
- **Empty check**: `head == tail` means no elements are between `head` and `tail`. The number of elements is `(tail - head + capacity) % capacity = 0`. ✓
- **Full check**: `(tail + 1) % capacity == head` means exactly `capacity - 1` slots are occupied. Adding one more element would make `tail` cycle to `head`, creating the `head == tail` condition while the queue is actually full. We prevent this by checking the full condition before `enqueue`. ✓

### Queue Mutator Preservation — `enqueue(e)`

```java
public void enqueue(E e) {
    if ((tail + 1) % capacity == head) resize(capacity * 2);
    data[tail] = e;
    tail = (tail + 1) % capacity;
}
```

**Order preservation**: `data[tail]` is the insertion point by definition. After writing `e` and advancing `tail` circularly, `e` is placed after all previously enqueued elements. Since `head` is unchanged, all elements from `head` to the old `tail-1` retain their relative order. The new element is at the tail position, the correct FIFO position. ✓

**Size correctness**: The number of elements is `(tail - head + capacity) % capacity`. Each `enqueue` increments `tail` (mod `capacity`), which increases this count by exactly 1 unless the queue was full (caught by the resize guard). ✓

### Queue Mutator Preservation — `dequeue()`

```java
public E dequeue() {
    E result = data[head];
    data[head] = null;
    head = (head + 1) % capacity;
    return result;
}
```

`data[head]` is the oldest enqueued element (by definition of `head`). The assignment advances `head` circularly, removing the oldest element from the FIFO sequence. The remaining elements shift forward in the logical sequence — their logical positions become `(head..tail-1)` modulo `capacity`, which is exactly the FIFO order of the remaining elements. ✓

### Why the Invariant Matters

Without the circular queue invariant, `dequeue()` might return the wrong element (not the oldest), and `head == tail` would be ambiguous. The invariant is what makes the queue implement FIFO semantics correctly over an *infinite* sequence of enqueue/dequeue operations on a finite buffer.

---

## 5. Hash Tables — Key Distribution, Load Factor, No-Cycle Invariant

### 💬 Study-Partner View — Hash-Table Invariants

**1. The bottom line:** A hash table is correct when every key sits in the bucket its hash points to, and it stays fast when the table is not too full.

**2. The textbook core:**

- **Placement:** key `k` is stored in bucket `hash(k) mod capacity` (or in its probe sequence).
- **Uniqueness:** a key appears at most once.
- **Load factor:** `size / capacity <= α` (Java default 0.75), restored by resizing and rehashing.
- **Contract:** `equals` implies equal `hashCode`; keys are not mutated while stored.

**3. The real-world analogy:** A **coat check**: each ticket number names one hook, no coat is on two hooks, and when the rack is nearly full the staff move everything to a bigger rack.

**4. Walkthrough:**

1. Capacity 4, load factor 0.75 → resize when `size` would exceed 3.
2. Insert 3 keys: invariant holds (`3/4 = 0.75`).
3. Insert a 4th key: first double capacity to 8 and **rehash** every key into its new bucket.
4. Then place the new key; placement and load-factor invariants hold again.

> [!NOTE]
> **Quick check:** Why must you rehash instead of copying buckets as they are? *The bucket index depends on the capacity, so every key's position changes.*


### Invariant Statement (Chaining)

> **Invariant (Hash Table — Chaining)**: Every key-value pair inserted into the table is stored in the bucket returned by `hash(k) mod capacity`. For any bucket `i`, the linked chain starting at `buckets[i]` contains exactly the pairs whose keys hash to `i`. No key appears in more than one bucket. The `size` field equals the total number of stored pairs.

> **Invariant (Load Factor)**: At all times, `loadFactor = size / capacity ≤ MAX_LOAD_FACTOR` (typically `0.75`). If an insert would violate this, a resize to `2 * capacity` occurs first.

> **Invariant (Probe Sequence — Open Addressing)**: For any key `k` being inserted, the probe sequence `(hash(k) + c₁·i + c₂·i²) mod capacity` (or equivalent) visits each slot at most once before finding an empty one. No slot is skipped.

### Initialization

`capacity = 16`, `size = 0`, `buckets = new Entry[capacity]`. All buckets are `null`. No pairs exist. `size/capacity = 0 ≤ 0.75`. All invariants hold. ✓

### Mutator Preservation — `put(k, v)` with chaining

```java
public void put(K k, V v) {
    if ((size + 1.0) / capacity > LOAD_FACTOR) resize(capacity * 2);
    int i = hash(k) % capacity;
    for (Entry e = buckets[i]; e != null; e = e.next)
        if (e.key.equals(k)) { e.value = v; return; }
    Entry n = new Entry(k, v);
    n.next = buckets[i];
    buckets[i] = n;
    size++;
}
```

**Load factor**: The guard `if ((size + 1.0) / capacity > LOAD_FACTOR)` ensures that after the optional resize, `size/capacity ≤ 0.75`. In the resize case, every pair is re-inserted into a new bucket array, so the bucket invariant holds (proved by the insertion logic below). ✓

**Bucket placement**: `i = hash(k) mod capacity` is computed. The `for` loop traverses the chain at `buckets[i]`. If a matching key is found, the value is updated — the pair remains in the same bucket, invariant unchanged. If no match is found, a new entry `n` is created and inserted at the head of the chain: `n.next = buckets[i]`. The new entry's `next` points to the former first element (or `null`). All elements previously in the chain remain reachable through `n.next`. No key is duplicated across buckets. ✓

### `get(k)` Correctness — No False Negatives

**Claim**: `get(k)` returns `v` if and only if `(k, v)` was previously inserted and not removed.

*If direction*: Suppose `(k, v)` was inserted. After insertion, it is in bucket `i = hash(k) mod capacity`. `get(k)` computes the same `i` (hash function is deterministic). It traverses the chain at `buckets[i]`. Since `(k, v)` is in that chain, the traversal finds it and returns `v`. ✓

*Only-if direction*: Suppose `get(k)` returns a value `v`. The traversal only examines keys in bucket `i`. Since the bucket invariant guarantees that exactly the keys that hash to `i` are in that chain, `k` must be one of those keys — i.e., `k` was inserted. ✓

### Probe Sequence Invariance (Open Addressing)

For linear probing (`h(k, i) = (hash(k) + i) mod capacity`):

> **Lemma**: Every slot `s` in `0..capacity-1` is probed at most once per `put(k, v)` call.

**Proof**: The probe sequence is `h₀ = hash(k) mod capacity`, `h₁ = (hash(k) + 1) mod capacity`, ..., `hᵢ = (hash(k) + i) mod capacity`. Modulo `capacity`, adding 1 cycles through all values. The sequence cannot repeat until it has visited all `capacity` slots, at which point the table is full. Since we resize before inserting into a full table, the probe terminates at an empty slot after probing at most `capacity` distinct slots. ✓

For double hashing (`h(k, i) = (hash₁(k) + i · hash₂(k)) mod capacity`): the invariant holds if `hash₂(k)` and `capacity` are coprime. If `capacity` is prime, this is guaranteed for any `hash₂(k) ≠ 0`. The proof uses number theory: the step size `hash₂(k)` generates the entire additive group modulo `capacity`, so all `capacity` slots are visited exactly once before repeating.

### Load Factor Preservation After Resize

> **Lemma**: After `resize(newCapacity)` where `newCapacity = 2 * capacity`, the load factor is at most half the previous load factor.

**Proof**: Let `size = s` before resize. `s / capacity ≤ MAX_LOAD_FACTOR` (otherwise resize would have been triggered earlier). After resize, `size` is unchanged. `newSize = s`. `newCapacity = 2 * capacity`. Therefore `newSize / newCapacity = s / (2 * capacity) = (1/2) * (s / capacity) ≤ (1/2) * MAX_LOAD_FACTOR`. Since `MAX_LOAD_FACTOR = 0.75`, after resize the load factor is at most `0.375`, well within the threshold. ✓

---

[Chapter overview](../A1_DS_Correctness_Invariants.md) | [6. BSTs — BST Property + Balance Invariant… →](02_bsts_bst_property_balance_invariant_avl.md)
