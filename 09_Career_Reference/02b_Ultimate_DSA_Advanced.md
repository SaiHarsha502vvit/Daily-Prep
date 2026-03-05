# Advanced Algorithms & Interview Patterns

> **Part 2 of Ultimate DSA Guide**
> **Navigation**: [Part 1: Data Structures](02_Ultimate_DSA_Guide.md) | [Part 2: Advanced] | [Part 3: JVM Internals](02c_Ultimate_DSA_JVM.md)

---

## 📝 String Algorithms — the Complete Toolkit

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STRING ALGORITHMS HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PATTERN MATCHING ALGORITHMS:                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ Algorithm    │ Time     │ Space │ Best For                              │    │
│  ├──────────────┼──────────┼───────┼───────────────────────────────────────┤    │
│  │ Naive        │ O(nm)    │ O(1)  │ Short patterns, simple cases          │    │
│  │ KMP          │ O(n+m)   │ O(m)  │ Single pattern, streaming             │    │
│  │ Rabin-Karp   │ O(n+m)†  │ O(1)  │ Multiple patterns same length         │    │
│  │ Z-Algorithm  │ O(n+m)   │ O(n)  │ All occurrences, string analysis     │     │
│  │ Aho-Corasick │ O(n+m+z) │ O(m)  │ Multiple patterns simultaneously     │     │
│  │ Suffix Array │ O(n log n)│O(n) │ Multiple queries on same text        │      │
│  │ Suffix Tree  │ O(n)     │ O(n)  │ Complex string operations            │     │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│  † Average case, O(nm) worst case with poor hash                                │
│                                                                                 │
│                                                                                 │
│  Z-ALGORITHM (All pattern occurrences):                                         │
│  ──────────────────────────────────────                                         │
```

```java
// Z[i] = length of longest substring starting at i that matches prefix
int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}

// Find all occurrences of pattern in text
List<Integer> findPattern(String text, String pattern) {
    String combined = pattern + "$" + text;  // $ is separator
    int[] z = zFunction(combined);

    List<Integer> matches = new ArrayList<>();
    int patLen = pattern.length();

    for (int i = patLen + 1; i < combined.length(); i++) {
        if (z[i] == patLen) {
            matches.add(i - patLen - 1);  // Position in original text
        }
    }
    return matches;
}
```

```
│ │
│ │
│ AHO-CORASICK (Multiple pattern matching): │
│ ────────────────────────────────────────── │
```


```java
class AhoCorasick {
    int[][] go = new int[MAX_STATES][26];  // Transition
    int[] fail = new int[MAX_STATES];       // Failure links
    boolean[] output = new boolean[MAX_STATES]; // Is end state?
    int states = 0;

    void addPattern(String p) {
        int cur = 0;
        for (char c : p.toCharArray()) {
            int ch = c - 'a';
            if (go[cur][ch] == -1) {
                go[cur][ch] = ++states;
            }
            cur = go[cur][ch];
        }
        output[cur] = true;
    }

    void build() {
        Queue<Integer> q = new LinkedList<>();

        // Initialize depth-1 states
        for (int c = 0; c < 26; c++) {
            if (go[0][c] != -1) {
                fail[go[0][c]] = 0;
                q.add(go[0][c]);
            } else {
                go[0][c] = 0;  // Loop back to root
            }
        }

        // BFS to build failure links
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int c = 0; c < 26; c++) {
                if (go[u][c] != -1) {
                    int v = go[u][c];
                    int f = fail[u];
                    while (go[f][c] == -1) f = fail[f];
                    fail[v] = go[f][c];
                    output[v] |= output[fail[v]];  // Inherit outputs
                    q.add(v);
                }
            }
        }
    }

    // Search text for any pattern
    boolean search(String text) {
        int state = 0;
        for (char c : text.toCharArray()) {
            int ch = c - 'a';
            while (go[state][ch] == -1) state = fail[state];
            state = go[state][ch];
            if (output[state]) return true;
        }
        return false;
    }
}
// Time: O(n + m + z) where z is number of matches
// Used in: Virus scanners, content filters, DNA analysis
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 📌 Randomized Algorithms


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ RANDOMIZED ALGORITHMS - POWER OF RANDOMNESS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHY RANDOMIZATION?                                                              │
│ • Simpler algorithms with good expected performance                             │
│ • Avoid adversarial worst cases                                                 │
│ • Handle uncertain or dynamic data                                              │
│                                                                                 │
│                                                                                 │
│ QUICKSELECT (Find k-th smallest element):                                       │
│ ──────────────────────────────────────────                                      │
```


```java
// O(n) expected, O(n²) worst case
int quickSelect(int[] arr, int k) {
    return quickSelect(arr, 0, arr.length - 1, k - 1);
}

int quickSelect(int[] arr, int lo, int hi, int k) {
    if (lo == hi) return arr[lo];

    // Random pivot to avoid worst case
    int pivotIdx = lo + new Random().nextInt(hi - lo + 1);
    pivotIdx = partition(arr, lo, hi, pivotIdx);

    if (k == pivotIdx) return arr[k];
    else if (k < pivotIdx) return quickSelect(arr, lo, pivotIdx - 1, k);
    else return quickSelect(arr, pivotIdx + 1, hi, k);
}

int partition(int[] arr, int lo, int hi, int pivotIdx) {
    int pivot = arr[pivotIdx];
    swap(arr, pivotIdx, hi);  // Move pivot to end
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            swap(arr, i++, j);
        }
    }
    swap(arr, i, hi);  // Move pivot to final position
    return i;
}
```

```
│ │
│ │
│ MILLER-RABIN PRIMALITY TEST: │
│ ──────────────────────────── │
```


```java
// Test if n is prime with high probability
// Error probability: (1/4)^k for k iterations
boolean isPrime(long n, int k) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // Write n-1 as 2^r * d
    long d = n - 1;
    int r = 0;
    while (d % 2 == 0) {
        d /= 2;
        r++;
    }

    // k rounds of testing
    Random rand = new Random();
    for (int i = 0; i < k; i++) {
        long a = 2 + rand.nextLong() % (n - 3);
        if (!millerTest(a, d, n, r)) {
            return false;  // Definitely composite
        }
    }
    return true;  // Probably prime
}

boolean millerTest(long a, long d, long n, int r) {
    long x = modPow(a, d, n);

    if (x == 1 || x == n - 1) return true;

    for (int i = 0; i < r - 1; i++) {
        x = modMult(x, x, n);
        if (x == n - 1) return true;
    }
    return false;
}
// Used in cryptography for generating large primes
```

```
│ │
│ │
│ RESERVOIR SAMPLING (Random sample from stream): │
│ ─────────────────────────────────────────────── │
```


```java
// Select k random items from unknown-size stream
int[] reservoirSample(Iterator<Integer> stream, int k) {
    int[] reservoir = new int[k];
    Random rand = new Random();

    // Fill reservoir with first k items
    for (int i = 0; i < k && stream.hasNext(); i++) {
        reservoir[i] = stream.next();
    }

    // Replace items with decreasing probability
    int n = k;
    while (stream.hasNext()) {
        int item = stream.next();
        n++;
        int j = rand.nextInt(n);  // Random index 0 to n-1
        if (j < k) {
            reservoir[j] = item;  // Replace with probability k/n
        }
    }

    return reservoir;
}
// Proof: Each item has exactly k/n probability of being selected
// Used in: Big data sampling, A/B testing, analytics
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 📌 Approximation Algorithms


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ APPROXIMATION ALGORITHMS FOR NP-HARD PROBLEMS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ When optimal is too slow, get "good enough" in polynomial time!                 │
│                                                                                 │
│                                                                                 │
│ VERTEX COVER - 2-APPROXIMATION:                                                 │
│ ─────────────────────────────────                                               │
```


```java
// Find vertex cover at most 2x optimal
// Greedy: pick both endpoints of any edge
Set<Integer> vertexCover(int n, int[][] edges) {
    Set<Integer> cover = new HashSet<>();
    boolean[] edgeCovered = new boolean[edges.length];

    for (int i = 0; i < edges.length; i++) {
        if (!edgeCovered[i]) {
            int u = edges[i][0], v = edges[i][1];
            cover.add(u);
            cover.add(v);

            // Mark all edges incident to u or v as covered
            for (int j = i; j < edges.length; j++) {
                if (edges[j][0] == u || edges[j][1] == u ||
                    edges[j][0] == v || edges[j][1] == v) {
                    edgeCovered[j] = true;
                }
            }
        }
    }
    return cover;
}
// Why 2-approximation?
// Optimal must include at least one endpoint of each edge
// We include both, so at most 2x optimal
```

```
│ │
│ │
│ SET COVER - log(n)-APPROXIMATION: │
│ ────────────────────────────────── │
```


```java
// Cover all elements using minimum number of sets
// Greedy: always pick set covering most uncovered elements
List<Set<Integer>> setCover(Set<Integer> universe, List<Set<Integer>> sets) {
    Set<Integer> uncovered = new HashSet<>(universe);
    List<Set<Integer>> cover = new ArrayList<>();

    while (!uncovered.isEmpty()) {
        // Find set covering most uncovered elements
        Set<Integer> best = null;
        int bestCount = 0;

        for (Set<Integer> s : sets) {
            Set<Integer> intersection = new HashSet<>(s);
            intersection.retainAll(uncovered);
            if (intersection.size() > bestCount) {
                bestCount = intersection.size();
                best = s;
            }
        }

        if (best == null) break;  // Can't cover all

        cover.add(best);
        uncovered.removeAll(best);
    }

    return cover;
}
// Approximation ratio: O(log n) where n = |universe|
// Used in: Resource allocation, facility location
```

```
│ │
│ │
│ TSP - 1.5-APPROXIMATION (Christofides): │
│ ──────────────────────────────────────── │
```


```java
// For metric TSP (triangle inequality holds)
// 1. Find MST
// 2. Find minimum matching on odd-degree vertices
// 3. Combine to get Eulerian graph
// 4. Find Eulerian tour and shortcut

// Simplified version (2-approximation using MST only):
List<Integer> tspApprox(int[][] dist, int n) {
    // Step 1: Build MST using Prim's
    boolean[] inMST = new boolean[n];
    int[] parent = new int[n];
    int[] key = new int[n];
    Arrays.fill(key, Integer.MAX_VALUE);
    key[0] = 0;
    parent[0] = -1;

    for (int count = 0; count < n; count++) {
        int u = minKey(key, inMST, n);
        inMST[u] = true;

        for (int v = 0; v < n; v++) {
            if (!inMST[v] && dist[u][v] < key[v]) {
                parent[v] = u;
                key[v] = dist[u][v];
            }
        }
    }

    // Step 2: DFS on MST to get tour order
    List<Integer> tour = new ArrayList<>();
    boolean[] visited = new boolean[n];
    dfs(0, parent, visited, tour, n);
    tour.add(0);  // Return to start

    return tour;
}
// Approximation: At most 2x optimal
// Christofides improves to 1.5x using minimum matching
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 📌 Modern Data Structures in Production


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PRODUCTION-GRADE DATA STRUCTURES                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ COUNT-MIN SKETCH (Approximate frequency counting):                              │
│ ──────────────────────────────────────────────────                              │
```


```java
class CountMinSketch {
    int[][] table;
    int[] hashA, hashB;  // Hash function parameters
    int width, depth;

    CountMinSketch(double epsilon, double delta) {
        // epsilon = error factor, delta = error probability
        this.width = (int) Math.ceil(Math.E / epsilon);
        this.depth = (int) Math.ceil(Math.log(1 / delta));
        this.table = new int[depth][width];

        Random rand = new Random();
        hashA = new int[depth];
        hashB = new int[depth];
        for (int i = 0; i < depth; i++) {
            hashA[i] = rand.nextInt();
            hashB[i] = rand.nextInt();
        }
    }

    int hash(int item, int i) {
        return Math.abs((hashA[i] * item + hashB[i]) % width);
    }

    void add(int item) {
        for (int i = 0; i < depth; i++) {
            table[i][hash(item, i)]++;
        }
    }

    int estimate(int item) {
        int min = Integer.MAX_VALUE;
        for (int i = 0; i < depth; i++) {
            min = Math.min(min, table[i][hash(item, i)]);
        }
        return min;  // Never underestimates, may overestimate
    }
}
// Used in: Network monitoring, database query optimization, trending detection
// Memory: O(1/ε * log(1/δ)) regardless of stream size!
```

```
│ │
│ │
│ HYPERLOGLOG (Cardinality estimation): │
│ ────────────────────────────────────── │
```


```java
class HyperLogLog {
    int[] registers;
    int m;  // Number of registers
    double alphaMM;

    HyperLogLog(int b) {  // b = log2(m)
        this.m = 1 << b;
        this.registers = new int[m];

        // Bias correction constant
        switch(m) {
            case 16: alphaMM = 0.673 * m * m; break;
            case 32: alphaMM = 0.697 * m * m; break;
            case 64: alphaMM = 0.709 * m * m; break;
            default: alphaMM = 0.7213 / (1 + 1.079/m) * m * m;
        }
    }

    void add(Object item) {
        long hash = hash64(item);
        int idx = (int) (hash >>> (64 - Integer.numberOfTrailingZeros(m)));
        int remaining = (int) (hash << Integer.numberOfTrailingZeros(m));
        int rank = Long.numberOfLeadingZeros(remaining) + 1;
        registers[idx] = Math.max(registers[idx], rank);
    }

    long estimate() {
        double sum = 0;
        int zeros = 0;

        for (int val : registers) {
            sum += Math.pow(2, -val);
            if (val == 0) zeros++;
        }

        double estimate = alphaMM / sum;

        // Small range correction
        if (estimate <= 2.5 * m && zeros > 0) {
            estimate = m * Math.log((double)m / zeros);
        }

        return Math.round(estimate);
    }
}
// Used in: Database COUNT(DISTINCT), unique visitor counting
// Memory: O(log log n) for counting up to n distinct elements!
// Error: ~1.04/√m standard error (m=2048 gives ~2% error)
```

```
│ │
│ │
│ CUCKOO FILTER (Better than Bloom filter): │
│ ────────────────────────────────────────── │
```


```java
class CuckooFilter {
    int[][] buckets;      // [bucket][slot]
    int bucketSize = 4;   // Slots per bucket
    int numBuckets;
    int fingerprintBits = 8;

    CuckooFilter(int capacity) {
        numBuckets = capacity / bucketSize;
        buckets = new int[numBuckets][bucketSize];
    }

    int fingerprint(int item) {
        return (hash(item) & ((1 << fingerprintBits) - 1)) | 1;  // Never 0
    }

    int bucket1(int item) {
        return hash(item) % numBuckets;
    }

    int bucket2(int b1, int fp) {
        return (b1 ^ hash(fp)) % numBuckets;  // XOR gives alternate bucket
    }

    boolean insert(int item) {
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);

        // Try to insert in either bucket
        if (insertToBucket(b1, fp)) return true;
        if (insertToBucket(b2, fp)) return true;

        // Cuckoo displacement
        int bucket = (Math.random() < 0.5) ? b1 : b2;
        for (int i = 0; i < 500; i++) {  // Max kicks
            // Pick random slot and swap
            int slot = (int)(Math.random() * bucketSize);
            int temp = buckets[bucket][slot];
            buckets[bucket][slot] = fp;
            fp = temp;

            bucket = bucket2(bucket, fp);
            if (insertToBucket(bucket, fp)) return true;
        }
        return false;  // Filter is full
    }

    boolean contains(int item) {
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);
        return bucketContains(b1, fp) || bucketContains(b2, fp);
    }

    boolean delete(int item) {  // BLOOM FILTER CAN'T DO THIS!
        int fp = fingerprint(item);
        int b1 = bucket1(item);
        int b2 = bucket2(b1, fp);
        return deleteFromBucket(b1, fp) || deleteFromBucket(b2, fp);
    }
}
// Advantages over Bloom:
// • Supports deletion
// • Better locality (only 2 lookups vs k)
// • Similar space efficiency
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 🎨 Interview Patterns — Advanced Level


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ADVANCED INTERVIEW PATTERNS                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ PATTERN 1: MONOTONIC STACK VARIATIONS                                           │
│ ─────────────────────────────────────────                                       │
```


```java
// Next Greater Element with circular array
int[] nextGreaterCircular(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    // Process array twice for circular behavior
    for (int i = 0; i < 2 * n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i % n]) {
            result[stack.pop()] = nums[i % n];
        }
        if (i < n) stack.push(i);
    }
    return result;
}

// Largest Rectangle in Histogram
int largestRectangle(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;

    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];

        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

```
│ │
│ │
│ PATTERN 2: SWEEP LINE ALGORITHM │
│ ──────────────────────────────── │
```


```java
// Count overlapping intervals at any point
int maxOverlap(int[][] intervals) {
    List<int[]> events = new ArrayList<>();

    for (int[] interval : intervals) {
        events.add(new int[]{interval[0], 1});   // Start
        events.add(new int[]{interval[1], -1});  // End
    }

    // Sort by time, ends before starts at same time
    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

    int current = 0, max = 0;
    for (int[] event : events) {
        current += event[1];
        max = Math.max(max, current);
    }
    return max;
}

// Skyline Problem
List<int[]> getSkyline(int[][] buildings) {
    List<int[]> events = new ArrayList<>();

    for (int[] b : buildings) {
        events.add(new int[]{b[0], -b[2]});  // Start: negative height
        events.add(new int[]{b[1], b[2]});   // End: positive height
    }

    events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

    List<int[]> result = new ArrayList<>();
    TreeMap<Integer, Integer> heights = new TreeMap<>();  // height -> count
    heights.put(0, 1);
    int prevMax = 0;

    for (int[] e : events) {
        if (e[1] < 0) {  // Building start
            heights.merge(-e[1], 1, Integer::sum);
        } else {  // Building end
            heights.merge(e[1], -1, Integer::sum);
            if (heights.get(e[1]) == 0) heights.remove(e[1]);
        }

        int currMax = heights.lastKey();
        if (currMax != prevMax) {
            result.add(new int[]{e[0], currMax});
            prevMax = currMax;
        }
    }
    return result;
}
```

```
│ │
│ │
│ PATTERN 3: BINARY SEARCH ON ANSWER │
│ ────────────────────────────────────── │
```


```java
// Minimize maximum: Allocate books to students
int minMaxPages(int[] books, int students) {
    int lo = 0, hi = 0;
    for (int pages : books) {
        lo = Math.max(lo, pages);  // At least max single book
        hi += pages;               // At most all books
    }

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canAllocate(books, students, mid)) {
            hi = mid;  // Try smaller max
        } else {
            lo = mid + 1;  // Need larger max
        }
    }
    return lo;
}

boolean canAllocate(int[] books, int students, int maxPages) {
    int required = 1;
    int current = 0;

    for (int pages : books) {
        if (current + pages > maxPages) {
            required++;
            current = pages;
        } else {
            current += pages;
        }
    }
    return required <= students;
}

// Similar pattern for:
// - Aggressive Cows (maximize minimum)
// - Split Array Largest Sum
// - Capacity To Ship Packages
```

```
│ │
│ │
│ PATTERN 4: MEET IN THE MIDDLE │
│ ───────────────────────────────── │
```


```java
// Subset sum with n up to 40 (too large for 2^n, but 2^20 is ok)
int closestSum(int[] nums, int target) {
    int n = nums.length;
    int half = n / 2;

    // Generate all subset sums for first half
    List<Integer> left = new ArrayList<>();
    for (int mask = 0; mask < (1 << half); mask++) {
        int sum = 0;
        for (int i = 0; i < half; i++) {
            if ((mask & (1 << i)) != 0) sum += nums[i];
        }
        left.add(sum);
    }
    Collections.sort(left);

    // For each subset of second half, binary search in first half
    int closest = Integer.MAX_VALUE;
    for (int mask = 0; mask < (1 << (n - half)); mask++) {
        int sum = 0;
        for (int i = 0; i < n - half; i++) {
            if ((mask & (1 << i)) != 0) sum += nums[half + i];
        }

        int need = target - sum;
        int idx = Collections.binarySearch(left, need);
        if (idx < 0) idx = -(idx + 1);

        if (idx < left.size()) {
            closest = Math.min(closest, Math.abs(target - (sum + left.get(idx))));
        }
        if (idx > 0) {
            closest = Math.min(closest, Math.abs(target - (sum + left.get(idx - 1))));
        }
    }
    return closest;
}
// Time: O(2^(n/2) * log(2^(n/2))) = O(n * 2^(n/2))
// vs naive O(2^n)
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```



## 📚 Complete DSA Mastery Checklist


```
╔══════════════════════════════════════════════════════════════════════════════════╗
║ DSA MASTERY CHECKLIST                                                            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║ FUNDAMENTALS (Must master completely):                                           ║
║ □ Arrays: Access, insertion, deletion, resizing                                  ║
║ □ Strings: Manipulation, comparison, pattern matching basics                     ║
║ □ Linked Lists: Singly, doubly, circular, operations                             ║
║ □ Stacks: Implementation, applications (parentheses, monotonic)                  ║
║ □ Queues: Regular, circular, deque, priority queue                               ║
║ □ Hash Tables: Collision handling, load factor, rehashing                        ║
║ □ Binary Trees: Traversals, BST operations, balancing concepts                   ║
║ □ Heaps: Build, insert, extract, heapify                                         ║
║ □ Graphs: Representations, BFS, DFS, connectivity                                ║
║                                                                                  ║
║ INTERMEDIATE (Should be comfortable):                                            ║
║ □ Sorting: Merge, Quick, Heap, Counting, Radix                                   ║
║ □ Searching: Binary search and variations                                        ║
║ □ Recursion: Base case, state, backtracking                                      ║
║ □ Dynamic Programming: 1D, 2D, state transitions                                 ║
║ □ Graph Algorithms: Dijkstra, Bellman-Ford, Topological sort                     ║
║ □ Tree Algorithms: LCA, diameter, tree DP basics                                 ║
║ □ Two Pointers: Same direction, opposite direction                               ║
║ □ Sliding Window: Fixed size, variable size                                      ║
║                                                                                  ║
║ ADVANCED (Know concepts and when to apply):                                      ║
║ □ Segment Trees: Range queries and updates                                       ║
║ □ Fenwick Trees: Prefix sums, point updates                                      ║
║ □ Union-Find: Path compression, union by rank                                    ║
║ □ Tries: String operations, prefix matching                                      ║
║ □ AVL/Red-Black: Self-balancing concepts                                         ║
║ □ String Algorithms: KMP, Z-algorithm, Rabin-Karp                                ║
║ □ Graph Advanced: MST, SCC, articulation points                                  ║
║ □ DP Optimization: Bitmask, interval, divide and conquer                         ║
║                                                                                  ║
║ EXPERT (For competitive programming):                                            ║
║ □ Suffix Arrays/Trees                                                            ║
║ □ Heavy-Light Decomposition                                                      ║
║ □ Centroid Decomposition                                                         ║
║ □ Persistent Data Structures                                                     ║
║ □ Convex Hull Trick                                                              ║
║ □ FFT for polynomial multiplication                                              ║
║ □ Network Flow algorithms                                                        ║
║                                                                                  ║
║ PRACTICAL KNOWLEDGE (For interviews):                                            ║
║ □ Complexity analysis (time and space)                                           ║
║ □ Trade-off discussions                                                          ║
║ □ Code optimization techniques                                                   ║
║ □ Testing and edge cases                                                         ║
║ □ Communication and problem-solving approach                                     ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```


```

---

# 🔧 PART FINAL-B: COMPLETE JVM INTERNALS FOR JAVA DEVELOPERS

```

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║ JVM INTERNALS - THE COMPLETE GUIDE FOR BUILDING FRAMEWORKS                       ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║ Why JVM knowledge matters:                                                       ║
║ • Understand WHY your code performs the way it does                              ║
║ • Debug memory issues (leaks, OOM errors)                                        ║
║ • Build frameworks like Spring, Hibernate, Mockito                               ║
║ • Optimize applications for production                                           ║
║ • Ace senior-level Java interviews                                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```




---

> **Prev**: [Part 1: Data Structures](02_Ultimate_DSA_Guide.md) | **Next**: [Part 3: JVM Internals](02c_Ultimate_DSA_JVM.md)


---

> **Navigation**: [< Previous](02b_DSA_Guide_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](02c_Ultimate_DSA_JVM.md)