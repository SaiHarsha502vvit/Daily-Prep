# 🎯 EXAM DAY FORMULAS & PATTERNS - INSTANT RECALL

## Print this file or memorize before exam!

---

## 📐 ESSENTIAL FORMULAS

### Array/String Index Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    INDEX CALCULATIONS                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array: [a, b, c, d, e, f, g]                                             ║
║  Index:  0  1  2  3  4  5  6                                              ║
║  Length: 7                                                                ║
║                                                                           ║
║  CRITICAL FORMULAS:                                                       ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Last index           = length - 1     = 7 - 1 = 6                 │  ║
║  │ Middle index         = length / 2     = 7 / 2 = 3 (integer div)   │  ║
║  │ Elements in [i,j]    = j - i + 1      (inclusive both ends)       │  ║
║  │ Reverse index of i   = length - 1 - i                             │  ║
║  │ Swap i with mirror   = swap(i, n-1-i)                             │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  SLIDING WINDOW SIZE:                                                     ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Window [i, j] has (j - i + 1) elements                            │  ║
║  │                                                                    │  ║
║  │ Example: i=2, j=5                                                  │  ║
║  │ [a, b, c, d, e, f, g]                                             │  ║
║  │        ↑--------↑                                                  │  ║
║  │        2        5                                                  │  ║
║  │ Count = 5 - 2 + 1 = 4 elements (c, d, e, f)                       │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  2D ARRAY FORMULAS:                                                       ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Rows = matrix.length                                              │  ║
║  │ Cols = matrix[0].length                                           │  ║
║  │ Total elements = rows × cols                                      │  ║
║  │ 1D index to 2D: row = index / cols, col = index % cols           │  ║
║  │ 2D to 1D index: index = row * cols + col                         │  ║
║  │ Diagonal check: row == col (main), row + col == n-1 (anti)       │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Binary Search Boundaries

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    BINARY SEARCH - GET IT RIGHT                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  STANDARD BINARY SEARCH:                                                  ║
║                                                                           ║
║  int low = 0, high = arr.length - 1;                                     ║
║  while (low <= high) {           // <= NOT <                             ║
║      int mid = low + (high - low) / 2;  // Avoids overflow!             ║
║      if (arr[mid] == target) return mid;                                 ║
║      else if (arr[mid] < target) low = mid + 1;                          ║
║      else high = mid - 1;                                                ║
║  }                                                                       ║
║  return -1;  // Not found                                                ║
║                                                                           ║
║  COMMON MISTAKES TO AVOID:                                                ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ ✗ mid = (low + high) / 2        → Can overflow!                   │  ║
║  │ ✓ mid = low + (high - low) / 2  → Safe                            │  ║
║  │                                                                    │  ║
║  │ ✗ while (low < high)  → Misses single element case                │  ║
║  │ ✓ while (low <= high) → Checks all elements                       │  ║
║  │                                                                    │  ║
║  │ ✗ low = mid, high = mid → Infinite loop!                          │  ║
║  │ ✓ low = mid + 1, high = mid - 1 → Correct                         │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  VARIANTS:                                                                ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ First occurrence: when match, result=mid, high=mid-1 (go LEFT)    │  ║
║  │ Last occurrence:  when match, result=mid, low=mid+1 (go RIGHT)    │  ║
║  │ Lower bound:      first >= target (insertion point)               │  ║
║  │ Upper bound:      first > target                                  │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 LOOP PATTERNS

### For Loop Templates

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    LOOP TEMPLATES                                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  STANDARD ITERATIONS:                                                     ║
║                                                                           ║
║  // Forward (0 to n-1)                                                   ║
║  for (int i = 0; i < n; i++)                                             ║
║                                                                           ║
║  // Backward (n-1 to 0)                                                  ║
║  for (int i = n - 1; i >= 0; i--)                                        ║
║                                                                           ║
║  // Skip first element (1 to n-1)                                        ║
║  for (int i = 1; i < n; i++)                                             ║
║                                                                           ║
║  // Skip last element (0 to n-2)                                         ║
║  for (int i = 0; i < n - 1; i++)                                         ║
║                                                                           ║
║  // Compare adjacent pairs                                                ║
║  for (int i = 0; i < n - 1; i++)                                         ║
║      compare(arr[i], arr[i + 1]);                                        ║
║                                                                           ║
║  // Two pointers (from ends)                                              ║
║  for (int i = 0, j = n - 1; i < j; i++, j--)                             ║
║                                                                           ║
║  ═══════════════════════════════════════════════════════════════════════  ║
║                                                                           ║
║  2D ARRAY ITERATIONS:                                                     ║
║                                                                           ║
║  // Row by row (normal)                                                  ║
║  for (int i = 0; i < rows; i++)                                          ║
║      for (int j = 0; j < cols; j++)                                      ║
║          process(matrix[i][j]);                                          ║
║                                                                           ║
║  // Column by column                                                     ║
║  for (int j = 0; j < cols; j++)                                          ║
║      for (int i = 0; i < rows; i++)                                      ║
║          process(matrix[i][j]);                                          ║
║                                                                           ║
║  // Main diagonal (i == j)                                               ║
║  for (int i = 0; i < n; i++)                                             ║
║      process(matrix[i][i]);                                              ║
║                                                                           ║
║  // Anti-diagonal (i + j == n-1)                                         ║
║  for (int i = 0; i < n; i++)                                             ║
║      process(matrix[i][n - 1 - i]);                                      ║
║                                                                           ║
║  // Upper triangle (j > i)                                               ║
║  for (int i = 0; i < n; i++)                                             ║
║      for (int j = i + 1; j < n; j++)                                     ║
║          process(matrix[i][j]);                                          ║
║                                                                           ║
║  // Lower triangle (i > j)                                               ║
║  for (int i = 0; i < n; i++)                                             ║
║      for (int j = 0; j < i; j++)                                         ║
║          process(matrix[i][j]);                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🧮 MATH FORMULAS

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    MATH FORMULAS FOR CODING                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  SUM FORMULAS:                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Sum 1 to N         = N × (N + 1) / 2                              │  ║
║  │ Sum of squares     = N × (N + 1) × (2N + 1) / 6                   │  ║
║  │ Sum of cubes       = [N × (N + 1) / 2]²                           │  ║
║  │ Sum of AP          = n/2 × (first + last)                         │  ║
║  │ Sum of GP          = a × (rⁿ - 1) / (r - 1)                       │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  DIGIT EXTRACTION:                                                        ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Last digit         = n % 10                                       │  ║
║  │ Remove last digit  = n / 10                                       │  ║
║  │ Count digits       = (int)Math.log10(n) + 1                       │  ║
║  │ Reverse number:                                                   │  ║
║  │     while (n > 0) {                                               │  ║
║  │         rev = rev * 10 + n % 10;                                  │  ║
║  │         n /= 10;                                                  │  ║
║  │     }                                                             │  ║
║  │ Palindrome check   = n == reverse(n)                              │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  DIVISIBILITY & PRIMES:                                                   ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ GCD (Euclidean)    = gcd(a, b) = gcd(b, a % b) until b = 0       │  ║
║  │ LCM                = (a × b) / gcd(a, b)                          │  ║
║  │ Check prime        = loop from 2 to √n                            │  ║
║  │ Factor pairs       = loop from 1 to √n, pair is n/i              │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  POWER OF 2 CHECKS:                                                       ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Is power of 2?     = n > 0 && (n & (n-1)) == 0                    │  ║
║  │ Next power of 2    = Integer.highestOneBit(n) << 1                │  ║
║  │ Count set bits     = Integer.bitCount(n)                          │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  MODULO ARITHMETIC:                                                       ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ (a + b) % m        = ((a % m) + (b % m)) % m                       │  ║
║  │ (a × b) % m        = ((a % m) × (b % m)) % m                       │  ║
║  │ (a - b) % m        = ((a % m) - (b % m) + m) % m  (avoid negative)│  ║
║  │ Common MOD value   = 1_000_000_007 (10⁹ + 7)                      │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📝 STRING MANIPULATION

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    STRING OPERATIONS QUICK REF                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  JAVA STRING METHODS:                                                     ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ s.length()                   → length of string                   │  ║
║  │ s.charAt(i)                  → character at index i               │  ║
║  │ s.substring(start, end)      → substring [start, end)            │  ║
║  │ s.indexOf(ch)                → first index of character           │  ║
║  │ s.lastIndexOf(ch)            → last index of character            │  ║
║  │ s.equals(other)              → compare (NEVER use ==)             │  ║
║  │ s.equalsIgnoreCase(other)    → case-insensitive compare           │  ║
║  │ s.toLowerCase()              → convert to lowercase               │  ║
║  │ s.toUpperCase()              → convert to uppercase               │  ║
║  │ s.trim()                     → remove leading/trailing spaces     │  ║
║  │ s.split(regex)               → split into array                   │  ║
║  │ s.toCharArray()              → convert to char array              │  ║
║  │ s.contains(str)              → check if contains substring        │  ║
║  │ s.startsWith(prefix)         → check prefix                       │  ║
║  │ s.replace(old, new)          → replace all occurrences            │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  CHARACTER OPERATIONS:                                                    ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Character.isLetter(ch)       → check if letter                    │  ║
║  │ Character.isDigit(ch)        → check if digit                     │  ║
║  │ Character.isLetterOrDigit(ch)→ check if alphanumeric              │  ║
║  │ Character.toLowerCase(ch)    → convert to lowercase               │  ║
║  │ Character.toUpperCase(ch)    → convert to uppercase               │  ║
║  │ ch - 'a'                     → index 0-25 for lowercase           │  ║
║  │ ch - 'A'                     → index 0-25 for uppercase           │  ║
║  │ ch - '0'                     → numeric value of digit char        │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  STRING BUILDING (for modifications):                                    ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ StringBuilder sb = new StringBuilder();                           │  ║
║  │ sb.append(ch);               → add character                      │  ║
║  │ sb.append(str);              → add string                         │  ║
║  │ sb.insert(index, ch);        → insert at position                 │  ║
║  │ sb.deleteCharAt(index);      → remove character                   │  ║
║  │ sb.reverse();                → reverse string                     │  ║
║  │ sb.toString();               → convert to String                  │  ║
║  │ sb.setCharAt(index, ch);     → replace character                  │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ⚠️ NEVER modify strings in loops! Use StringBuilder instead.            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🗃️ DATA STRUCTURE INITIALIZATION

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    INSTANT INITIALIZATION                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ARRAYS:                                                                  ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ int[] arr = new int[n];                  // Default 0             │  ║
║  │ int[] arr = {1, 2, 3, 4, 5};             // With values           │  ║
║  │ int[][] matrix = new int[rows][cols];    // 2D array              │  ║
║  │ Arrays.fill(arr, value);                 // Fill with value       │  ║
║  │ Arrays.sort(arr);                        // Sort ascending        │  ║
║  │ Arrays.copyOf(arr, newLength);           // Copy array            │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  LISTS:                                                                   ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ List<Integer> list = new ArrayList<>();                           │  ║
║  │ list.add(value);             // Add to end                        │  ║
║  │ list.add(index, value);      // Insert at index                   │  ║
║  │ list.get(index);             // Get element                       │  ║
║  │ list.set(index, value);      // Update element                    │  ║
║  │ list.remove(index);          // Remove by index                   │  ║
║  │ list.size();                 // Get size                          │  ║
║  │ Collections.sort(list);      // Sort list                         │  ║
║  │ Collections.reverse(list);   // Reverse list                      │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  MAPS:                                                                    ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Map<String, Integer> map = new HashMap<>();                       │  ║
║  │ map.put(key, value);                     // Add/update            │  ║
║  │ map.get(key);                            // Get value (or null)   │  ║
║  │ map.getOrDefault(key, defaultVal);       // Get or default        │  ║
║  │ map.containsKey(key);                    // Check key exists      │  ║
║  │ map.containsValue(value);                // Check value exists    │  ║
║  │ map.remove(key);                         // Remove entry          │  ║
║  │ map.keySet();                            // Get all keys          │  ║
║  │ map.values();                            // Get all values        │  ║
║  │ map.entrySet();                          // Get key-value pairs   │  ║
║  │                                                                    │  ║
║  │ // Frequency count pattern:                                       │  ║
║  │ map.put(ch, map.getOrDefault(ch, 0) + 1);                         │  ║
║  │                                                                    │  ║
║  │ // Merge (Java 8+):                                               │  ║
║  │ map.merge(key, 1, Integer::sum);         // Add 1 to count        │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  SETS:                                                                    ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Set<Integer> set = new HashSet<>();      // Unordered             │  ║
║  │ Set<Integer> set = new TreeSet<>();      // Sorted                │  ║
║  │ Set<Integer> set = new LinkedHashSet<>();// Insertion order       │  ║
║  │ set.add(value);              // Add element                       │  ║
║  │ set.contains(value);         // Check if exists                   │  ║
║  │ set.remove(value);           // Remove element                    │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  STACK & QUEUE:                                                           ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ // Stack                                                          │  ║
║  │ Deque<Integer> stack = new ArrayDeque<>();                        │  ║
║  │ stack.push(value);           // Add to top                        │  ║
║  │ stack.pop();                 // Remove from top                   │  ║
║  │ stack.peek();                // View top (don't remove)           │  ║
║  │ stack.isEmpty();             // Check if empty                    │  ║
║  │                                                                    │  ║
║  │ // Queue                                                          │  ║
║  │ Queue<Integer> queue = new LinkedList<>();                        │  ║
║  │ queue.offer(value);          // Add to back                       │  ║
║  │ queue.poll();                // Remove from front                 │  ║
║  │ queue.peek();                // View front                        │  ║
║  │                                                                    │  ║
║  │ // Priority Queue (Min Heap by default)                          │  ║
║  │ PriorityQueue<Integer> pq = new PriorityQueue<>();               │  ║
║  │ PriorityQueue<Integer> maxPq = new PriorityQueue<>(              │  ║
║  │     Collections.reverseOrder());         // Max Heap              │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 PATTERN DETECTION CHART

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    DETECT PATTERN INSTANTLY                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  YOU SEE THIS              →           USE THIS PATTERN                   ║
║  ═══════════════════════════════════════════════════════════════════════  ║
║                                                                           ║
║  "subarray of size k"      →           Fixed Sliding Window              ║
║  "longest/shortest subarray with condition" →  Variable Sliding Window   ║
║  "pair that sums to"       →           Two Pointers (if sorted)          ║
║                           →           HashMap (if unsorted)              ║
║  "anagram / permutation"   →           Frequency Count                   ║
║  "palindrome"              →           Two Pointers (ends to middle)     ║
║  "sorted array"            →           Binary Search                     ║
║  "find in rotated sorted"  →           Modified Binary Search            ║
║  "subarray sum equals k"   →           Prefix Sum + HashMap              ║
║  "max/min in sliding window" →         Deque (Monotonic)                 ║
║  "next greater element"    →           Monotonic Stack                   ║
║  "balanced brackets"       →           Stack                             ║
║  "level order / shortest path" →       BFS with Queue                    ║
║  "all paths / combinations" →          DFS / Backtracking                ║
║  "kth largest/smallest"    →           Heap / QuickSelect                ║
║  "top k frequent"          →           HashMap + Heap                    ║
║  "connected components"    →           DFS/BFS or Union-Find             ║
║  "intervals overlap"       →           Sort by start, then merge         ║
║  "count ways to do X"      →           Dynamic Programming               ║
║  "can you do X?"           →           DP / Backtracking                 ║
║  "optimal substructure"    →           Dynamic Programming               ║
║  "sort 0s, 1s, 2s"         →           Dutch National Flag               ║
║  "find duplicate"          →           Floyd's Tortoise & Hare           ║
║  "rotate array"            →           Reversal Algorithm                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## ⏱️ COMPLEXITY QUICK CHECK

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    QUICK COMPLEXITY CHECK                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  INPUT SIZE (N)    |  MAX ACCEPTABLE COMPLEXITY                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║  N ≤ 10            |  O(N!), O(2^N) OK - Try all permutations            ║
║  N ≤ 20            |  O(2^N) OK - Backtracking / subset                  ║
║  N ≤ 100           |  O(N³) OK - Triple nested loops                     ║
║  N ≤ 1,000         |  O(N²) OK - Double nested loops                     ║
║  N ≤ 10,000        |  O(N²) borderline - Consider O(N log N)             ║
║  N ≤ 100,000       |  O(N log N) needed - Sort, divide & conquer         ║
║  N ≤ 1,000,000     |  O(N) or O(N log N) - Single pass, maps             ║
║  N ≤ 10,000,000    |  O(N) only - Tight! Linear algorithms only          ║
║  N ≤ 10^9          |  O(log N) or O(√N) - Binary search, math            ║
║  N ≤ 10^18         |  O(log N) - Math formulas, binary search            ║
║                                                                           ║
║  RULE OF THUMB:                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Most online judges allow ~10^8 operations per second               │  ║
║  │ If your algorithm does N² operations and N=10,000:                │  ║
║  │    10,000² = 100,000,000 = 10^8 → BORDERLINE (might TLE)          │  ║
║  │                                                                    │  ║
║  │ SAFE estimates:                                                   │  ║
║  │    O(N²) is safe up to N=3,000                                    │  ║
║  │    O(N log N) is safe up to N=10,000,000                          │  ║
║  │    O(N) is safe up to N=100,000,000                               │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📌 EXAM CHECKLIST

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    BEFORE SUBMITTING - CHECK!                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  □ Did I handle empty input?                                              ║
║  □ Did I handle single element?                                           ║
║  □ Did I handle all negative numbers?                                     ║
║  □ Did I handle all same elements?                                        ║
║  □ Did I handle integer overflow? (use long if needed)                    ║
║  □ Did I return the correct type?                                         ║
║  □ Did I use <= vs < correctly in loops?                                  ║
║  □ Did I use == vs .equals() correctly for strings?                       ║
║  □ Did I handle index out of bounds?                                      ║
║  □ Did I avoid off-by-one errors?                                         ║
║  □ Does my solution handle the examples correctly?                        ║
║                                                                           ║
║  COMMON BUGS TO WATCH:                                                    ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ ✗ arr.length instead of arr.length - 1 for last index             │  ║
║  │ ✗ i < n instead of i <= n (or vice versa)                         │  ║
║  │ ✗ Forgot to return statement                                      │  ║
║  │ ✗ Return type mismatch                                            │  ║
║  │ ✗ Integer division when needed decimal                            │  ║
║  │ ✗ Modifying collection while iterating                            │  ║
║  │ ✗ Not initializing variables                                      │  ║
║  │ ✗ Off-by-one in substring/subarray                                │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 GOOD LUCK ON YOUR EXAM!

**Remember:**

1. Read the problem TWICE
2. Identify the pattern
3. Write the skeleton first
4. Handle edge cases
5. Test with examples before submitting

**You've got this! 💪**
