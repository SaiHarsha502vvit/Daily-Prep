# 🏆 Capstone 1 — DSA Toolkit Library

> **Semester:** 1 | **Unit:** Capstone  
> **Estimated time:** 20 hours  
> **Difficulty:** Expert  
> **Language:** Java 17+

---

## 🎯 Business Requirement (The PM Brief)

*You are a new engineer at a fintech startup. The CTO has decided to stop depending on Java's built-in collections for the core trading engine — they need full control over memory layout and performance characteristics. Your first task: build a production-quality, fully-tested DSA Toolkit that the team can use and extend.*

---

## 📋 Technical Specification

### Deliverables

You must implement the following classes in `JavaSolutions/cap01_dsa_toolkit/`:

| Class | Contract |
|---|---|
| `DynamicArray<T>` | Resizable array, O(1) amortized add, O(1) get, O(n) insert/remove |
| `SinglyLinkedList<T>` | O(1) addFirst/addLast, O(n) get/remove, cycle detection |
| `Stack<T>` | O(1) push/pop/peek, backed by linked list |
| `Queue<T>` | O(1) enqueue/dequeue, backed by circular array |
| `Deque<T>` | O(1) addFirst/addLast/removeFirst/removeLast |
| `HashMap<K,V>` | Chaining, O(1) amortized put/get, auto-resize at 0.75 load |
| `MinHeap<T>` | O(log n) insert/extractMin, O(1) peek, O(n) buildHeap |
| `BST<T>` | Insert, delete, search, inorder, height, isValid, kthSmallest |
| `Graph` | BFS, DFS, Dijkstra, topological sort, cycle detection |
| `Sorter` | MergeSort, QuickSort, HeapSort (in-place for primitives) |

### Acceptance Criteria

- [ ] Every class compiles with Java 17+
- [ ] Every public method has a Javadoc comment with `@param`, `@return`, `@throws`, and `// Time: O(?), Space: O(?)` annotation
- [ ] JUnit 5 test suite achieves ≥ 90% line coverage (run with: `mvn test jacoco:report`)
- [ ] `HashMap` and `DynamicArray` pass a stress test of 1,000,000 insertions without error
- [ ] All classes use generics correctly — no raw type warnings in compilation

---

## 🏗️ Project Structure

```
JavaSolutions/
└── cap01_dsa_toolkit/
    ├── src/main/java/toolkit/
    │   ├── DynamicArray.java
    │   ├── SinglyLinkedList.java
    │   ├── Stack.java
    │   ├── Queue.java
    │   ├── Deque.java
    │   ├── HashMap.java
    │   ├── MinHeap.java
    │   ├── BST.java
    │   ├── Graph.java
    │   └── Sorter.java
    ├── src/test/java/toolkit/
    │   ├── DynamicArrayTest.java
    │   ├── HashMapTest.java
    │   ├── MinHeapTest.java
    │   ├── BSTTest.java
    │   ├── GraphTest.java
    │   └── SorterTest.java
    └── pom.xml
```

---

## 📝 Skeleton Code (Critical Classes)

### HashMap.java
```java
package toolkit;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/**
 * Chaining-based HashMap.
 * Time: O(1) amortized put/get/remove (with good hash distribution)
 * Space: O(n) where n = number of entries
 */
public class HashMap<K, V> {
    private static final int DEFAULT_CAPACITY = 16;
    private static final double LOAD_FACTOR = 0.75;

    private LinkedList<Entry<K, V>>[] buckets;
    private int size;
    private int capacity;

    record Entry<K, V>(K key, V value) {}

    @SuppressWarnings("unchecked")
    public HashMap() {
        // TODO: initialize buckets, size, capacity
    }

    /**
     * Associates value with key. Overwrites existing mapping if key exists.
     * Time: O(1) amortized, Space: O(1) amortized
     */
    public void put(K key, V value) {
        // TODO
    }

    /**
     * Returns value for key, or null if not found.
     * Time: O(1) average
     */
    public V get(K key) {
        // TODO
        return null;
    }

    /**
     * Removes the mapping for key. No-op if not found.
     * Time: O(1) average
     */
    public void remove(K key) {
        // TODO
    }

    public boolean containsKey(K key) { return get(key) != null; }
    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    private int bucketIndex(K key) {
        // TODO: Math.abs(key.hashCode()) % capacity — handle null keys if desired
        return 0;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        // TODO: double capacity, create new buckets array, rehash all existing entries
    }
}
```

### BST.java
```java
package toolkit;

import java.util.ArrayList;
import java.util.List;

/**
 * Binary Search Tree with rich operations.
 * Invariant: For every node N, all keys in left subtree < N.key < all keys in right subtree
 */
public class BST<T extends Comparable<T>> {
    private Node<T> root;

    private static class Node<T> {
        T val;
        Node<T> left, right;
        Node(T val) { this.val = val; }
    }

    // Time: O(h) where h = height = O(log n) average, O(n) worst
    public void insert(T val) { /* TODO: iterative or recursive */ }
    
    // Time: O(h)
    public boolean contains(T val) { /* TODO */ return false; }
    
    // Time: O(h) — handle 3 cases: no child, one child, two children (replace with inorder successor)
    public void delete(T val) { /* TODO */ }
    
    // Time: O(n), Space: O(h) — returns sorted ascending list
    public List<T> inorder() { /* TODO */ return new ArrayList<>(); }
    
    // Time: O(n)
    public int height() { /* TODO: recursive */ return 0; }
    
    // Validates BST invariant using min/max bounds approach
    // Time: O(n)
    public boolean isValid() { /* TODO: helper(node, min, max) */ return true; }
    
    // Returns the k-th smallest element (1-indexed)
    // Time: O(n)
    public T kthSmallest(int k) { /* TODO: inorder counter */ return null; }
    
    // Returns LCA of nodes with values a and b
    // Time: O(h) using BST property
    public T lowestCommonAncestor(T a, T b) { /* TODO */ return null; }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why It Happens | The Fix |
|---|---|---|
| `DynamicArray.get()` throws AIOOBE | Not checking `index < size` (vs `index < data.length`) | Bounds check against `size`, not `capacity` |
| `HashMap.put()` returns null for existing key | Not scanning bucket chain for existing key before adding | Linear search chain before creating new Entry |
| `HashMap` loses entries after resize | Reusing old bucket index (modulo old capacity) | Rehash all entries using new capacity |
| `MinHeap.extractMin()` returns wrong value | Not swapping root with last before removing | Swap first, then siftDown from root |
| `BST.delete()` corrupts tree for 2-child node | Not replacing with inorder successor | Find min of right subtree, copy value, delete that min node |
| `Graph.dijkstra()` gives wrong results on negative edges | Greedy assumption breaks | Use Bellman-Ford when negative edges exist |

---

## 🚀 Extension Challenges

Once the base project passes all tests:

1. **Implement `LRUCache`** combining your `HashMap` and `DoublyLinkedList`
2. **Implement `PriorityQueue<T>`** (min and max) using your `MinHeap`
3. **Add thread safety** to `HashMap` using `ReadWriteLock` (see `07_Modern_Java/Ch15_Concurrency_Core.md`)
4. **Benchmark** your `HashMap` vs Java's `HashMap` for 1M insertions using `System.nanoTime()`
5. **Implement `TreeMap`** using your `BST` with inorder iteration support (`Iterable<T>`)

---

## 📊 Self-Assessment Rubric

| Criterion | 0 — Not Met | 1 — Partial | 2 — Met | 3 — Exceeded |
|---|---|---|---|---|
| All 10 classes implemented | <5 | 5-7 | 8-9 | All 10 + bonus |
| Correct Big-O | Major errors | Minor errors | Mostly correct | All correct + benchmarked |
| JUnit coverage | <50% | 50-75% | 75-90% | >90% |
| Javadoc quality | Missing | Minimal | Complete | Complete + examples |
| Generics correctness | Raw types | Mostly typed | Fully typed | Typed + bounded wildcards |

---

[← Back to Semester 1 Guide](../../00_CURRICULUM/SEMESTER_1_GUIDE.md)
