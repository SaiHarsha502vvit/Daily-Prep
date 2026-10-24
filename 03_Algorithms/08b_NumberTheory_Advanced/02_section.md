# Part 6 — Data Structure Problems: Why and How

> **Navigation**: [← Part 5 — More Essential Algorithms](01_section.md) | [Chapter overview](../08b_NumberTheory_Advanced.md) | [Part 7 — Real-Life Incident → DSA Mapping →](03_section.md)
> Page 2 of 4 in **Essential Algorithms, Data-Structure Problems and a Study Plan**


## Stack Problems

### Problem S1: Valid Parentheses (THE classic stack problem)

```java
/**
 * WHY: Compilers use this to check code syntax
 * WHERE: IDE error highlighting, JSON/XML validation
 *
 * REAL INCIDENT:
 *   A production config file had mismatched braces
 *   System crashed at midnight. Stack-based validator
 *   was added to prevent deployment of bad configs.
 */
public static boolean isValidParentheses(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;

            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }

    return stack.isEmpty();
}

// TEST:
// isValidParentheses("()[]{}") → true
// isValidParentheses("([)]") → false
// isValidParentheses("{[]}") → true
```

### Problem S2: Min Stack (Stack that returns min in O(1))

```java
/**
 * WHY: Need to track minimum while supporting push/pop
 * WHERE: Real-time min price tracker, job scheduler priority
 *
 * TRICK: Store pairs (value, currentMin) or use two stacks
 */
class MinStack {
    private Stack<int[]> stack = new Stack<>(); // [value, currentMin]

    public void push(int val) {
        int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, min});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1]; // O(1)!
    }
}
```

---

## Queue & Deque Problems

### Problem Q1: Sliding Window Maximum ⭐⭐

```java
/**
 * WHY: Find maximum in every window of size k
 * WHERE: Stock market (max price in last k days), network monitoring
 *
 * REAL INCIDENT:
 *   Network monitoring: Alert if max latency in any 5-minute
 *   window exceeds 500ms. Need to compute this sliding max
 *   efficiently for millions of data points.
 *
 * DSA: Monotonic Deque
 * Time: O(n), Space: O(k)
 */
public static int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>(); // Stores indices

    for (int i = 0; i < n; i++) {
        // Remove elements outside current window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove elements smaller than current (they'll never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // Window is full, record result
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}

// TEST:
// maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3) → [3,3,5,5,6,7]
```

---

## HashMap Problems

### Problem H1: Two Sum (THE most asked question)

```java
/**
 * WHY: Foundation of many hash-based solutions
 * WHERE: Financial matching (find two transactions that sum to X)
 */
public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];

        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }

        map.put(nums[i], i);
    }

    return new int[]{-1, -1};
}
```

### Problem H2: Subarray Sum Equals K ⭐⭐

```java
/**
 * WHY: Count subarrays with given sum using prefix sum + hashmap
 * WHERE: Analytics - find all date ranges where revenue = target
 *
 * TRICK: If prefix[j] - prefix[i] = k, subarray (i, j] has sum k
 * So we need: prefix[j] - k = prefix[i]
 * Count how many prefix[i] values we've seen
 */
public static int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // Empty subarray

    int count = 0;
    int currentSum = 0;

    for (int num : nums) {
        currentSum += num;

        // How many prefix sums equal (currentSum - k)?
        count += prefixCount.getOrDefault(currentSum - k, 0);

        prefixCount.merge(currentSum, 1, Integer::sum);
    }

    return count;
}

// TEST:
// subarraySum([1, 1, 1], 2) → 2  (subarrays: [1,1], [1,1])
// subarraySum([1, 2, 3], 3) → 2  (subarrays: [1,2], [3])
```

### Problem H3: Longest Consecutive Sequence ⭐⭐

```java
/**
 * WHY: Find longest streak of consecutive numbers in O(n)
 * WHERE: Identify continuous time ranges in logs, find gaps in data
 *
 * REAL INCIDENT:
 *   Server log had timestamps. Needed to find longest period
 *   of continuous minute-by-minute data (no gaps).
 *
 * TRICK: Only start counting from sequence START (no num-1 in set)
 */
public static int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int num : nums) set.add(num);

    int maxLength = 0;

    for (int num : set) {
        // Only start counting if this is the START of a sequence
        if (!set.contains(num - 1)) {
            int current = num;
            int length = 1;

            while (set.contains(current + 1)) {
                current++;
                length++;
            }

            maxLength = Math.max(maxLength, length);
        }
    }

    return maxLength;
}

// TEST:
// longestConsecutive([100, 4, 200, 1, 3, 2]) → 4 (sequence: 1,2,3,4)
// longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]) → 9
```

---

## Tree Problems

### Problem T1: Lowest Common Ancestor ⭐⭐

```java
/**
 * WHY: Find common parent of two nodes
 * WHERE:
 *   - Organization chart: "Who supervises both person A and person B?"
 *   - File system: common parent directory
 *   - Git: merge base of two branches
 *
 * REAL INCIDENT:
 *   HR system needed to find lowest-level manager who oversees
 *   both Employee X and Employee Y for conflict resolution
 */
public static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    if (left != null && right != null) return root; // Split point = LCA
    return left != null ? left : right;
}
```

### Problem T2: Serialize/Deserialize Binary Tree ⭐⭐⭐

```java
/**
 * WHY: Convert tree to string and back
 * WHERE:
 *   - Send tree data over network (API responses)
 *   - Store tree in database
 *   - Cache tree structures in Redis
 *
 * REAL INCIDENT:
 *   Menu hierarchy stored as tree in DB. Needed to cache
 *   in Redis (string storage). Serialize tree → store →
 *   deserialize on read.
 */
public static String serialize(TreeNode root) {
    if (root == null) return "null";
    return root.val + "," + serialize(root.left) + "," + serialize(root.right);
}

public static TreeNode deserialize(String data) {
    Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
    return deserializeHelper(queue);
}

private static TreeNode deserializeHelper(Queue<String> queue) {
    String val = queue.poll();
    if ("null".equals(val)) return null;

    TreeNode node = new TreeNode(Integer.parseInt(val));
    node.left = deserializeHelper(queue);
    node.right = deserializeHelper(queue);
    return node;
}
```

---

[← Part 5 — More Essential Algorithms](01_section.md) | [Chapter overview](../08b_NumberTheory_Advanced.md) | [Part 7 — Real-Life Incident → DSA Mapping →](03_section.md)
