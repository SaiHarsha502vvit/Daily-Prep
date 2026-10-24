# 🔬 PART 10C: PERFORMANCE COMPARISON - ALL DATA STRUCTURES

> **Navigation**: [← JAVA COLLECTIONS FRAMEWORK - INTERNAL…](04_java_collections_framework_internal_architecture.md) | [Chapter overview](../01g_DS_Internals.md) | [University-Level Addendum — DS Internals as… →](06_university_level_addendum_ds_internals_as.md)
> Page 5 of 6 in **Data Structure Internals — CPU & Memory Level**


## Complete time-complexity comparison

| Data Structure | Access | Search | Insert | Delete | Space | Notes |
| -------------- | ------ | ------ | ------ | ------ | ----- | ----- |
| Array | O(1) | O(n) | O(n) | O(n) | O(n) | Fixed size |
| ArrayList | O(1) | O(n) | O(1)* | O(n) | O(n) | Dynamic |
| LinkedList | O(n) | O(n) | O(1)† | O(1)† | O(n) | Pointers |
| Stack | O(n) | O(n) | O(1) | O(1) | O(n) | LIFO |
| Queue | O(n) | O(n) | O(1) | O(1) | O(n) | FIFO |
| HashSet | - | O(1) | O(1) | O(1) | O(n) | No order |
| TreeSet | - | O(log n) | O(log n) | O(log n) | O(n) | Sorted |
| HashMap | - | O(1) | O(1) | O(1) | O(n) | No order |
| TreeMap | - | O(log n) | O(log n) | O(log n) | O(n) | Sorted |
| LinkedHashMap | - | O(1) | O(1) | O(1) | O(n) | Insertion order |
| Heap / PQ | - | O(n) | O(log n) | O(log n) | O(n) | Priority |
| BST (balanced) | - | O(log n) | O(log n) | O(log n) | O(n) | Sorted |
| BST (unbalanced) | - | O(n) | O(n) | O(n) | O(n) | Avoid! |
| Trie | - | O(m) | O(m) | O(m) | O(n×m) | Strings |
| Graph (adjacency list) | - | O(V+E) | O(1) | O(E/V) | O(V+E) | Sparse |
| Graph (adjacency matrix) | - | O(1) | O(1) | O(1) | O(V²) | Dense |

\* Amortized O(1), worst case O(n) during resize.
† O(1) if the position is known, O(n) to find the position.
`m` = length of the string (for Trie); `V` = vertices, `E` = edges (for Graph).

## Memory overhead comparison — storing 1,000,000 integers

| Data Structure | Memory | Overhead explanation |
| -------------- | ------ | -------------------- |
| `int[]` | ~4 MB | 4 bytes × 1M + 16 header |
| `Integer[]` | ~20 MB | 16 bytes × 1M + references |
| `ArrayList<Integer>` | ~24 MB | Integer objects + ArrayList overhead |
| `LinkedList<Integer>` | ~48 MB | Node (24) + Integer (16) per element |
| `HashSet<Integer>` | ~52 MB | Entry overhead + Integer objects |
| `TreeSet<Integer>` | ~56 MB | TreeNode + Integer objects |

> [!IMPORTANT]
> **Key insight:**
> - Primitive arrays are 5–14× more memory efficient.
> - Use primitive arrays when possible for large datasets.
> - Consider libraries like Trove or Eclipse Collections for primitive support.

## Real-world benchmark

Test setup: 100,000 elements, JDK 17, Intel i7-10700 @ 3.8 GHz (illustrative numbers).

**Add operations:**

| Collection | Time (ns) | Visualization |
| ---------- | --------- | ------------- |
| `ArrayList.add` | 8 | ██ |
| `LinkedList.add` | 15 | ████ |
| `HashSet.add` | 25 | ██████ |
| `TreeSet.add` | 150 | ██████████████████████████████████████ |

**Get / contains operations:**

| Collection | Time (ns) | Visualization |
| ---------- | --------- | ------------- |
| `ArrayList.get` | 5 | █ |
| `LinkedList.get` | 25000 | off the chart (5000× slower!) |
| `HashSet.contains` | 12 | ███ |
| `TreeSet.contains` | 80 | ████████████████████ |

**Iteration over all elements:**

| Collection | Time (ms) | Notes |
| ---------- | --------- | ----- |
| `int[]` | 0.3 | Best cache locality |
| `ArrayList` | 0.8 | Good cache locality |
| `LinkedList` | 12.0 | Poor cache locality (40× slower!) |
| `HashSet` | 3.2 | Moderate: must traverse buckets |
| `TreeSet` | 2.5 | In-order traversal |

---

## PRACTICE PROBLEMS — Data Structures Fundamentals

### Arrays

| #   | Problem                             | Difficulty | Source | Key Concept                              |
| --- | ----------------------------------- | ---------- | ------ | ---------------------------------------- |
| 1   | Two Sum                             | Easy       | LC 1   | HashMap lookup                           |
| 2   | Best Time to Buy and Sell Stock     | Easy       | LC 121 | Kadane's variant                         |
| 3   | Contains Duplicate                  | Easy       | LC 217 | HashSet                                  |
| 4   | Product of Array Except Self        | Medium     | LC 238 | Prefix/suffix arrays                     |
| 5   | Maximum Subarray                    | Medium     | LC 53  | Kadane's algorithm                       |
| 6   | Merge Intervals                     | Medium     | LC 56  | Sort + sweep                             |
| 7   | 3Sum                                | Medium     | LC 15  | Sort + two pointers                      |
| 8   | Trapping Rain Water                 | Hard       | LC 42  | Two pointers / stack                     |
| 9   | First Missing Positive              | Hard       | LC 41  | Cyclic sort                              |
| 10  | Maximize Distance to Closest Person | Medium     | LC 849 | Gap analysis (less famous, great logic!) |
| 11  | Subarray Sum Equals K               | Medium     | LC 560 | Prefix sum + HashMap                     |
| 12  | Rotate Array                        | Medium     | LC 189 | Reverse trick                            |
| 13  | Next Permutation                    | Medium     | LC 31  | Scan from right                          |
| 14  | Minimum Size Subarray Sum           | Medium     | LC 209 | Sliding window                           |
| 15  | Longest Consecutive Sequence        | Medium     | LC 128 | HashSet sequence                         |

### LinkedLists

| #   | Problem                       | Difficulty | Source | Key Concept                |
| --- | ----------------------------- | ---------- | ------ | -------------------------- |
| 1   | Reverse Linked List           | Easy       | LC 206 | Pointer reversal           |
| 2   | Merge Two Sorted Lists        | Easy       | LC 21  | Dummy head                 |
| 3   | Linked List Cycle             | Easy       | LC 141 | Floyd's slow/fast          |
| 4   | Remove Nth Node From End      | Medium     | LC 19  | Two-pointer gap            |
| 5   | Add Two Numbers               | Medium     | LC 2   | Carry propagation          |
| 6   | Reorder List                  | Medium     | LC 143 | Find mid + reverse + merge |
| 7   | Copy List with Random Pointer | Medium     | LC 138 | HashMap clone              |
| 8   | LRU Cache                     | Medium     | LC 146 | HashMap + Doubly LL        |
| 9   | Merge K Sorted Lists          | Hard       | LC 23  | Min-heap of heads          |
| 10  | Palindrome Linked List        | Easy       | LC 234 | Reverse 2nd half + compare |
| 11  | Swap Nodes in Pairs           | Medium     | LC 24  | Recursive or iterative     |
| 12  | Sort List                     | Medium     | LC 148 | Merge sort on LL           |

### Stacks & Queues

| #   | Problem                          | Difficulty | Source  | Key Concept            |
| --- | -------------------------------- | ---------- | ------- | ---------------------- |
| 1   | Valid Parentheses                | Easy       | LC 20   | Matching brackets      |
| 2   | Min Stack                        | Medium     | LC 155  | Auxiliary min tracking |
| 3   | Evaluate Reverse Polish Notation | Medium     | LC 150  | Operand stack          |
| 4   | Daily Temperatures               | Medium     | LC 739  | Monotonic stack        |
| 5   | Largest Rectangle in Histogram   | Hard       | LC 84   | Monotonic stack        |
| 6   | Implement Queue using Stacks     | Easy       | LC 232  | Amortized O(1)         |
| 7   | Simplify Path                    | Medium     | LC 71   | Stack + split          |
| 8   | Asteroid Collision               | Medium     | LC 735  | Stack simulation       |
| 9   | Online Stock Span                | Medium     | LC 901  | Monotonic stack        |
| 10  | Sliding Window Maximum           | Hard       | LC 239  | Monotonic deque        |
| 11  | Remove All Adjacent Duplicates   | Easy       | LC 1047 | Stack simulation       |
| 12  | Next Greater Element I           | Easy       | LC 496  | Monotonic stack + map  |

### HashMaps & HashSets

| #   | Problem                             | Difficulty | Source | Key Concept            |
| --- | ----------------------------------- | ---------- | ------ | ---------------------- |
| 1   | Two Sum                             | Easy       | LC 1   | Complement lookup      |
| 2   | Group Anagrams                      | Medium     | LC 49  | Sorted key grouping    |
| 3   | Longest Substring Without Repeating | Medium     | LC 3   | Sliding window + set   |
| 4   | Top K Frequent Elements             | Medium     | LC 347 | HashMap + heap         |
| 5   | Valid Anagram                       | Easy       | LC 242 | Frequency count        |
| 6   | Isomorphic Strings                  | Easy       | LC 205 | Two-way mapping        |
| 7   | Word Pattern                        | Easy       | LC 290 | Bijection check        |
| 8   | Subarray Sum Equals K               | Medium     | LC 560 | Prefix sum map         |
| 9   | First Unique Character              | Easy       | LC 387 | Frequency → scan       |
| 10  | Design HashMap                      | Easy       | LC 706 | Implement from scratch |
| 11  | Encode and Decode TinyURL           | Medium     | LC 535 | Hash function design   |
| 12  | Intersection of Two Arrays II       | Easy       | LC 350 | Frequency matching     |

**Hidden Gem Problems (rarely listed but highly educational):**

| Problem                      | Source | Why It's Great                            |
| ---------------------------- | ------ | ----------------------------------------- |
| Brick Wall                   | LC 554 | HashMap on gaps — think differently       |
| Contiguous Array             | LC 525 | Prefix sum + HashMap (0/1 balance)        |
| Find All Anagrams in String  | LC 438 | Fixed window + frequency match            |
| Minimum Window Substring     | LC 76  | Variable window + HashMap (Hard, classic) |
| Design Linked List           | LC 707 | Build from scratch — tests everything     |
| Flatten Nested List Iterator | LC 341 | Stack + recursion on nested structures    |

---

_Continue in Part 2: 02a_DS_Variants_Core.md_

---


---

[← JAVA COLLECTIONS FRAMEWORK - INTERNAL…](04_java_collections_framework_internal_architecture.md) | [Chapter overview](../01g_DS_Internals.md) | [University-Level Addendum — DS Internals as… →](06_university_level_addendum_ds_internals_as.md)
