# 🎭 Mock Interview Simulations — Practice Like It's Real

[⬅ Problem Decomposition](08_Problem_Decomposition_Framework.md) | [📚 Index](00_INDEX.md)

---

**"Practice doesn't make perfect. PERFECT practice makes perfect."**

This chapter puts EVERYTHING from Files 01-08 together into complete mock interview simulations — exactly how a real interview flows.

---

## Table of Contents

1. [How to Use These Simulations](#1-how-to-use-these-simulations)
2. [Mock 1: DSA — Array/String (45 min)](#2-mock-1-dsa-array-string)
3. [Mock 2: DSA — Tree/Graph (45 min)](#3-mock-2-dsa-tree-graph)
4. [Mock 3: SQL Interview (45 min)](#4-mock-3-sql-interview)
5. [Mock 4: System Design (45 min)](#5-mock-4-system-design)
6. [Mock 5: OOP Design (45 min)](#6-mock-5-oop-design)
7. [Mock 6: Mixed Round (60 min)](#7-mock-6-mixed-round)
8. [Self-Evaluation Rubric](#8-self-evaluation-rubric)
9. [Common Interview Mistakes](#9-common-interview-mistakes)

---

## 1. How to Use These Simulations

```
SIMULATION PROTOCOL:

  1. SET A TIMER — Strict time limits. No pausing.
  2. SPEAK OUT LOUD — Narrate your thinking (even if alone).
  3. USE A WHITEBOARD or plain text editor (no autocomplete).
  4. FOLLOW THE FRAMEWORK from File 01 (The Interview Brain).
  5. After each simulation, SCORE YOURSELF using Section 8.

WHAT EACH SIMULATION INCLUDES:
  ✅ The question (as interviewer would ask it)
  ✅ Ideal thought process (what to think at each step)
  ✅ Expected dialogue (what to SAY to interviewer)
  ✅ Solution with explanations
  ✅ Follow-up questions (interviewers always ask these)
  ✅ Scoring criteria
```

---

## 2. Mock 1: DSA — Array/String (45 min)

### The Question

```
INTERVIEWER: "Given an array of integers and a target sum,
find all unique quadruplets [a, b, c, d] such that
a + b + c + d = target. No duplicate quadruplets."

Example:
  nums = [1, 0, -1, 0, -2, 2], target = 0
  Output: [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]
```

### Ideal Thought Process (What to Think)

```
MINUTE 0-2: UNDERSTAND
  "This is 4Sum — extension of 2Sum and 3Sum."
  Input: int[] nums, int target
  Output: List<List<Integer>> — all unique quadruplets summing to target
  Constraint: No duplicates in output

MINUTE 2-4: ANALYZE CONSTRAINTS
  "What's the size of nums? Up to 200."
  n ≤ 200 → O(n³) = 8 million operations ✅ (fits in time)
  O(n²) would be ideal but O(n³) is acceptable for n ≤ 200.

MINUTE 4-6: PATTERN MATCH
  "I know 2Sum uses HashMap or two pointers on sorted array.
   3Sum: Sort + fix one + two pointers = O(n²).
   4Sum: Sort + fix two + two pointers = O(n³)."

MINUTE 6-8: PLAN
  Step 1: Sort the array
  Step 2: Two nested loops (fix a and b)
  Step 3: Two pointers for c and d
  Step 4: Skip duplicates at every level
```

### Expected Dialogue

```
YOU: "This is a 4Sum problem. I see it's an extension of the classic
      2Sum and 3Sum patterns.

      My approach: Sort the array first, then use two nested loops
      for the first two elements, and two pointers for the remaining two.
      This gives O(n³) time, which should be fine for n ≤ 200.

      The key challenge is handling duplicates — I'll skip them
      at each level after sorting.

      Should I proceed with this approach?"

INTERVIEWER: "Sounds good. Go ahead."
```

### Solution

```java
public List<List<Integer>> fourSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Step 1: Sort
    int n = nums.length;

    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;  // skip dup

        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue;  // skip dup

            int left = j + 1, right = n - 1;
            while (left < right) {
                long sum = (long) nums[i] + nums[j] + nums[left] + nums[right];

                if (sum == target) {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;  // skip dup
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }
    }
    return result;
}
```

### Follow-Up Questions

```
Q1: "Why did you cast to long?"
A: "To prevent integer overflow. Four integers summed could exceed
    Integer.MAX_VALUE (2^31 - 1 ≈ 2.1 billion)."

Q2: "Can you do better than O(n³)?"
A: "For general 4Sum, O(n³) is the best known for sorted approach.
    We could use a HashMap to store all pair sums → O(n²) average
    but O(n⁴) worst case and harder to handle duplicates.
    For this constraint (n ≤ 200), O(n³) is optimal in practice."

Q3: "How would you generalize to kSum?"
A: "Recursive approach: reduce kSum to (k-1)Sum until the base case
    of 2Sum with two pointers. Time: O(n^(k-1))."
```

---

## 3. Mock 2: DSA — Tree/Graph (45 min)

### The Question

```
INTERVIEWER: "Given a binary tree, find the lowest common ancestor
of two given nodes p and q. All node values are unique, and both
p and q exist in the tree."
```

### Ideal Thought Process

```
MINUTE 0-2: UNDERSTAND
  LCA = the deepest node that is ancestor of both p and q
  If p is ancestor of q → LCA is p
  If they're in different subtrees → LCA is the split point

MINUTE 2-4: PATTERN MATCH
  This is a classic tree recursion problem.
  Key insight: If I find p in left subtree and q in right subtree,
  the current node IS the LCA.

MINUTE 4-6: PLAN
  Recursive approach:
  Base case: node is null, or node == p, or node == q → return node
  Recurse left and right
  If both return non-null → current node is LCA
  If only one returns non-null → that's the LCA (both are in that subtree)
```

### Expected Dialogue

```
YOU: "Let me think about this. The LCA has three cases:
      1. Both p and q are in the left subtree → LCA is in left
      2. Both in right subtree → LCA is in right
      3. One in each → current node is the LCA

      I'll use post-order recursion: search left, search right,
      then decide at the current node. This is O(n) time, O(h) space
      for the recursion stack."
```

### Solution

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // Base cases
    if (root == null || root == p || root == q) return root;

    // Search both subtrees
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // Decision
    if (left != null && right != null) return root;  // split point = LCA
    return left != null ? left : right;               // both in one subtree
}
```

### Follow-Up Questions

```
Q1: "What if nodes might NOT exist in the tree?"
A: "I'd need to verify both exist first. I can add a boolean flag
    or do a pre-check traversal. The current solution would return
    wrong answer if one node is missing."

Q2: "What if this was a BST instead of a binary tree?"
A: "In a BST, I can use the property: if both p and q are less than root,
    go left. If both greater, go right. Otherwise, root is the LCA.
    Same O(n) worst case but O(log n) for balanced BST."

Q3: "What about LCA queries on millions of nodes?"
A: "For repeated queries, I'd preprocess using Euler tour + sparse table
    for O(1) query after O(n log n) preprocessing. Or use binary lifting
    for O(log n) per query with O(n log n) preprocessing."
```

---

🔬 **Section Challenge — 3. Mock 2: DSA — Tree/Graph (45 min)**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).

<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).

</details>

## 4. Mock 3: SQL Interview (45 min)

### The Question

```
INTERVIEWER: "We have tables:
  employees(id, name, department_id, salary, hire_date, manager_id)
  departments(id, name)

Write queries for:
  1. Find employees earning more than their department's average salary.
  2. For each department, show the employee with the longest tenure.
  3. Find departments where ALL employees earn more than $50,000."
```

### Solution and Dialogue

```
YOU: "Let me solve these one at a time."

-- Query 1: Above department average
-- "I'll use a window function to compare each employee's salary
--  to their department's average in a single pass."

SELECT name, salary, department_id, dept_avg
FROM (
    SELECT e.*, AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
    FROM employees e
) sub
WHERE salary > dept_avg;

-- "Alternative with correlated subquery, but the window function
--  approach is more readable and equally efficient."

-- Query 2: Longest tenure per department
-- "ROW_NUMBER partitioned by department, ordered by hire_date ascending.
--  Earliest hire_date = longest tenure."

WITH ranked AS (
    SELECT e.name, e.department_id, e.hire_date, d.name AS dept_name,
           ROW_NUMBER() OVER (
               PARTITION BY e.department_id ORDER BY e.hire_date ASC
           ) AS rn
    FROM employees e
    JOIN departments d ON e.department_id = d.id
)
SELECT dept_name, name, hire_date FROM ranked WHERE rn = 1;

-- Query 3: Departments where ALL earn > $50K
-- "This is a universal quantifier. In SQL, we express 'ALL' as
--  'NOT EXISTS any that violate the condition'."

SELECT d.name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.department_id = d.id AND e.salary <= 50000
);

-- Alternative: Use MIN
SELECT d.name
FROM departments d
JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
HAVING MIN(e.salary) > 50000;
```

### Follow-Up Questions

```
Q1: "How would you optimize Query 1 for a table with 10M rows?"
A: "Add a composite index on (department_id, salary). The window function
    approach already scans once, but the index helps with I/O.
    For very large tables, consider materialized views that pre-compute
    department averages, refreshed periodically."

Q2: "What if two employees in the same department have the same hire_date?"
A: "ROW_NUMBER assigns arbitrary rank for ties. I'd use RANK or DENSE_RANK
    instead, and adjust the filter to WHERE rn = 1 to return ALL ties.
    Or add a secondary sort: ORDER BY hire_date ASC, id ASC for determinism."
```

---

## 5. Mock 4: System Design (45 min)

### The Question

```
INTERVIEWER: "Design a notification system that can send
push notifications, emails, and SMS to millions of users."
```

### Ideal 45-Minute Flow

```
MINUTES 0-5: REQUIREMENTS

YOU: "Let me clarify the requirements.
  Functional:
    - Send notifications via push, email, SMS
    - Support scheduled and triggered notifications
    - Users can set preferences (opt out of channels)
    - Delivery tracking (sent, delivered, read)

  Non-functional:
    - 100M notifications/day
    - < 30 second delivery latency for triggers
    - At-least-once delivery (critical: no missed notifications)
    - Graceful degradation (if SMS provider is down, don't block others)

  Out of scope: notification content creation, A/B testing"

MINUTES 5-10: ESTIMATION

YOU: "Let me estimate the scale.
  100M notifications/day
  QPS: 100M / 86400 ≈ 1200 QPS average
  Peak: 3x = ~3600 QPS (during marketing campaigns)
  Storage: Each notification record ~500 bytes
  Daily: 100M × 500 = 50 GB/day
  1 year: 18 TB
  → Moderate write volume, need async processing"

MINUTES 10-25: HIGH-LEVEL DESIGN

  ┌──────────┐    ┌──────────────┐    ┌────────────┐
  │ API /    │───►│ Notification │───►│   Kafka    │
  │ Trigger  │    │   Service    │    │   Queue    │
  └──────────┘    └──────────────┘    └─────┬──────┘
                                            │
                        ┌───────────────────┼──────────────────┐
                        ▼                   ▼                  ▼
                  ┌───────────┐     ┌───────────┐     ┌───────────┐
                  │Push Worker│     │Email Worker│    │SMS Worker  │
                  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
                        ▼                 ▼                  ▼
                  ┌───────────┐     ┌───────────┐     ┌───────────┐
                  │ Firebase  │     │ SendGrid  │     │  Twilio   │
                  │ (FCM/APNs)│     │           │     │           │
                  └───────────┘     └───────────┘     └───────────┘

  Key Components:
    1. Notification Service: Validates request, checks user preferences,
       creates notification record, publishes to Kafka
    2. Kafka Topics: One per channel (push, email, sms)
    3. Workers: Channel-specific consumers, handle retries + rate limiting
    4. User Preference DB: Redis cache + PostgreSQL for channel opt-outs
    5. Notification DB: PostgreSQL for delivery tracking

MINUTES 25-40: DEEP DIVE

  RELIABILITY:
    "Kafka gives us at-least-once delivery. Workers are idempotent
     using the notification_id as dedup key. If a worker crashes
     mid-processing, Kafka redelivers to another consumer."

  RATE LIMITING:
    "External providers have rate limits (e.g., SendGrid 100K/hour).
     Workers use a token bucket rate limiter. If rate limit hit,
     messages stay in Kafka for retry."

  PRIORITY:
    "Two Kafka topics per channel: high-priority (password reset, OTP)
     and low-priority (marketing). High-priority consumers run on
     dedicated consumers with no rate sharing."

  FAILURE HANDLING:
    "Circuit breaker on each provider. If Twilio is down for SMS,
     the circuit opens, messages accumulate in Kafka (retained for
     7 days), and we try a backup provider (Vonage).
     Users see a delayed notification rather than a lost one."

  DEDUPLICATION:
    "Notification Service generates a unique ID before publishing.
     Workers store processed IDs in Redis with 24-hour TTL.
     If same ID arrives again (Kafka retry), worker skips it."

MINUTE 40-45: WRAP UP

YOU: "To summarize: this system handles 100M+ notifications per day
  using Kafka for reliable async processing, channel-specific workers
  for isolation, Redis for user preferences and dedup, and circuit
  breakers for external provider failures. The architecture is
  horizontally scalable — add more workers to handle higher volume."
```

---

## 6. Mock 5: OOP Design (45 min)

### The Question

```
INTERVIEWER: "Design an online book store system.
Support browse catalog, add to cart, checkout, order tracking."
```

### Solution Walkthrough

```
MINUTES 0-5: IDENTIFY ENTITIES (Nouns → Classes)
  - User (Customer, Admin)
  - Book (title, author, price, ISBN, stock)
  - Cart, CartItem
  - Order, OrderItem
  - Payment
  - Address
  - Category

MINUTES 5-15: DEFINE RELATIONSHIPS AND CORE CLASSES

  User has-one Cart
  Cart has-many CartItems
  Order has-many OrderItems
  Book belongs-to Category

MINUTES 15-35: KEY CLASSES AND PATTERNS
```

```java
// Strategy Pattern: Payment processing
public interface PaymentStrategy {
    boolean pay(double amount);
}
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    public boolean pay(double amount) { /* charge card */ return true; }
}
public class PayPalPayment implements PaymentStrategy {
    private String email;
    public boolean pay(double amount) { /* PayPal API */ return true; }
}

// Observer Pattern: Order status updates
public class Order {
    private List<OrderStatusListener> listeners = new ArrayList<>();
    private OrderStatus status;

    public void updateStatus(OrderStatus newStatus) {
        this.status = newStatus;
        for (OrderStatusListener l : listeners) {
            l.onStatusChange(this, newStatus);
        }
    }
}

// State Pattern: Order lifecycle
public enum OrderStatus {
    CREATED, PAYMENT_PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
}

// Cart with business logic
public class Cart {
    private Map<Book, Integer> items = new LinkedHashMap<>();

    public void addItem(Book book, int quantity) {
        if (book.getStock() < quantity) {
            throw new InsufficientStockException(book, quantity);
        }
        items.merge(book, quantity, Integer::sum);
    }

    public double getTotal() {
        return items.entrySet().stream()
            .mapToDouble(e -> e.getKey().getPrice() * e.getValue())
            .sum();
    }

    public Order checkout(PaymentStrategy payment, Address shipping) {
        double total = getTotal();
        if (!payment.pay(total)) {
            throw new PaymentFailedException();
        }
        Order order = new Order(items, shipping, total);
        items.clear();
        return order;
    }
}
```

```
MINUTES 35-45: DISCUSS TRADE-OFFS

YOU: "Key design decisions:
  1. Strategy for payment → easy to add new payment methods
  2. Observer for order tracking → email service, SMS service,
     analytics all subscribe to order events
  3. Cart is in-memory per session; for production I'd persist
     to Redis for session survival
  4. Stock management: optimistic locking on checkout to prevent
     selling more than available"
```

---

## 7. Mock 6: Mixed Round (60 min)

### Part A: Quick DSA (15 min)

```
Q: "Given a string, find the length of the longest substring
    without repeating characters."

THINK: Sliding window + HashSet/HashMap
  - Expand right pointer: add char to set
  - If duplicate: shrink left until no duplicate
  - Track max window size

CODE:
  public int lengthOfLongestSubstring(String s) {
      Set<Character> window = new HashSet<>();
      int left = 0, maxLen = 0;
      for (int right = 0; right < s.length(); right++) {
          while (window.contains(s.charAt(right))) {
              window.remove(s.charAt(left++));
          }
          window.add(s.charAt(right));
          maxLen = Math.max(maxLen, right - left + 1);
      }
      return maxLen;
  }

TIME: O(n), SPACE: O(min(n, alphabet_size))
```

### Part B: Quick SQL (15 min)

```
Q: "Find the top 3 highest-spending customers per month."

ANSWER:
  WITH monthly_spend AS (
      SELECT customer_id,
             DATE_TRUNC('month', order_date) AS month,
             SUM(amount) AS total,
             RANK() OVER (
                 PARTITION BY DATE_TRUNC('month', order_date)
                 ORDER BY SUM(amount) DESC
             ) AS rnk
      FROM orders
      GROUP BY customer_id, DATE_TRUNC('month', order_date)
  )
  SELECT c.name, ms.month, ms.total
  FROM monthly_spend ms
  JOIN customers c ON ms.customer_id = c.id
  WHERE ms.rnk <= 3
  ORDER BY ms.month, ms.rnk;

EXPLAIN: "I use RANK instead of ROW_NUMBER because if two customers
tie for 3rd place, both should be included."
```

### Part C: System Design (15 min)

```
Q: "You have 1 billion log entries per day.
    Design a system to search them by keyword."

QUICK DESIGN:
  Ingestion: Application logs → Kafka (buffering, ordering)
  Processing: Kafka → Logstash/Flink (parse, enrich, transform)
  Storage: Elasticsearch (inverted index for full-text search)
  Query: Kibana dashboard or REST API for search
  Retention: 30 days hot (SSD), 1 year warm (HDD), S3 for archive

  Scale math: 1B entries × 500 bytes = 500 GB/day raw
  With replicas: 500 GB × 3 replicas = 1.5 TB/day ES storage
  30-day hot: 45 TB → cluster of 15 nodes (3 TB SSD each)
```

### Part D: Behavioral (15 min)

```
Q: "Tell me about a time you debugged a difficult production issue."

FRAMEWORK (STAR-T):
  Situation: "Our payment service was intermittently timing out,
    affecting 2% of transactions during peak hours."

  Task: "I owned the investigation as the on-call engineer."

  Action:
    "First, I checked metrics — P99 latency spiked from 200ms to 5s.
     Then I correlated with database metrics — connection pool was
     exhausted. I traced to a code path that opened connections in a
     loop without closing them in the error path. The fix was adding
     try-with-resources to ensure connection cleanup."

  Result: "Timeout rate dropped from 2% to 0.01%. I also added
    connection pool metrics to our dashboard and a circuit breaker
    to prevent cascading failures."

  Takeaway: "I learned to always check resource cleanup in error paths,
    not just happy paths. Now I default to try-with-resources."
```

---

## 8. Self-Evaluation Rubric

```
SCORE YOURSELF AFTER EACH MOCK (1-5 per category):

┌─────────────────────────────┬───┬──────────────────────────────┐
│ Category                     │ /5│ What 5 looks like             │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Problem Understanding       │   │ Restated clearly, asked       │
│                              │   │ clarifying Q's, identified    │
│                              │   │ edge cases before coding      │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Approach & Communication    │   │ Explained approach before      │
│                              │   │ coding, discussed alternatives│
│                              │   │ narrated while coding         │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Code Quality                │   │ Clean, correct, handles edge  │
│                              │   │ cases, good variable names    │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Complexity Analysis         │   │ Correct time + space, could   │
│                              │   │ discuss trade-offs            │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Follow-up Handling          │   │ Handled follow-ups gracefully,│
│                              │   │ discussed optimizations       │
├─────────────────────────────┼───┼──────────────────────────────┤
│ Time Management             │   │ Finished core solution with   │
│                              │   │ time for testing/discussion   │
├─────────────────────────────┼───┼──────────────────────────────┤
│ TOTAL                       │/30│ 25+: Strong hire              │
│                              │   │ 20-24: Hire with reservations│
│                              │   │ 15-19: Needs improvement     │
│                              │   │ <15: Significant practice    │
└─────────────────────────────┴───┴──────────────────────────────┘
```

---

## 9. Common Interview Mistakes

```
MISTAKE 1: JUMPING TO CODE
  ❌ Immediately writing code without discussing approach
  ✅ Spend 5 minutes understanding and planning BEFORE coding

MISTAKE 2: SILENT CODING
  ❌ Typing for 20 minutes without saying a word
  ✅ Narrate: "Now I'm iterating through... I check if..."

MISTAKE 3: NOT TESTING
  ❌ "I think this is correct" and stop
  ✅ Walk through your code with the example input, step by step

MISTAKE 4: OVER-ENGINEERING
  ❌ Building perfect architecture for a 45-minute problem
  ✅ Working solution first, then optimize if time allows

MISTAKE 5: IGNORING EDGE CASES
  ❌ Only testing happy path
  ✅ Test: empty input, single element, all same, max size

MISTAKE 6: NOT ASKING QUESTIONS
  ❌ Assuming you understand everything
  ✅ "Can the array contain duplicates?" "Is it sorted?"

MISTAKE 7: GIVING UP
  ❌ "I don't know this algorithm"
  ✅ "I haven't seen this exact problem, but let me think about
      what patterns apply. The constraint is n ≤ 10^5, so I need
      O(n log n) or better. It involves subarrays, so maybe
      sliding window or prefix sum..."

MISTAKE 8: POOR TIME MANAGEMENT
  ❌ Spending 30 minutes on a perfect solution to part 1,
      no time for parts 2 and 3
  ✅ Get a working solution, move on, come back if time

THE GOLDEN RULE:
  "A working brute-force solution that you explain well
   beats an optimal solution you can't explain."
```

---

## Your 30-Day Mock Interview Schedule

```
WEEK 1 (Foundation):
  Day 1-2: Mock 1 (Array/String) — practice 2x
  Day 3-4: Mock 2 (Tree/Graph) — practice 2x
  Day 5:   Mock 3 (SQL) — practice 1x
  Day 6:   Self-study weak areas from scores
  Day 7:   Rest

WEEK 2 (Depth):
  Day 8-9:  New DSA problems (LeetCode Medium)
  Day 10-11: Mock 4 (System Design) — practice 2x
  Day 12:   Mock 5 (OOP Design)
  Day 13:   Mock 6 (Mixed Round)
  Day 14:   Rest

WEEK 3 (Breadth):
  Day 15-16: LeetCode Medium/Hard — timed practice
  Day 17-18: System Design (new problem each day)
  Day 19:    SQL complex queries timed
  Day 20:    Mock 6 variation — all new problems
  Day 21:    Rest

WEEK 4 (Polish):
  Day 22-23: Full mock interviews with a friend
  Day 24-25: Review ALL mistakes from weeks 1-3
  Day 26:    Practice behavioral questions (STAR-T)
  Day 27:    Light review — read Files 01-03 (Brain, Constraints, Patterns)
  Day 28:    REST before real interview
```

---

## Cross-References

| Topic                 | Deep Dive                                                                   |
| --------------------- | --------------------------------------------------------------------------- |
| Interview Mindset     | [01_The_Interview_Brain](01_The_Interview_Brain.md)                         |
| Constraint Analysis   | [02_Constraint_to_Algorithm_Map](02_Constraint_to_Algorithm_Map.md)         |
| Pattern Library       | [03_DSA_Pattern_Recognition_Engine](03_DSA_Pattern_Recognition_Engine.md)   |
| Complexity Analysis   | [04_Complexity_Analysis_Masterclass](04_Complexity_Analysis_Masterclass.md) |
| SQL Patterns          | [05_SQL_Interview_Thinking](05_SQL_Interview_Thinking.md)                   |
| System Design         | [06_System_Design_Blueprint](06_System_Design_Blueprint.md)                 |
| Design Patterns       | [07_Design_Patterns_Interview_Guide](07_Design_Patterns_Interview_Guide.md) |
| Problem Decomposition | [08_Problem_Decomposition_Framework](08_Problem_Decomposition_Framework.md) |

---

[⬅ Problem Decomposition](08_Problem_Decomposition_Framework.md) | [📚 Index](00_INDEX.md)


---

## Reality Check

**"Mock interviews are practice runs of the real thing"** ? Mocks train the specific skills solo practice cannot � performing under observation, thinking aloud to a person, handling real-time hints and push-back ([01, 14_MM interview-thinking]): the difference between solving alone and solving while a person watches and interjects (the [14_MM] performance-under-observation), the hint-integration ([14_MM] hints-are-investment), the time-pressure-with-an-audience. "Practice runs" undersells them � mocks are where you build the interactive-performance skills (narrating, handling interruption, managing the social pressure) that solo problem-solving never exercises, and the candidate who only practices alone and enters the real interview having never performed-for-a-person discovers the gap exactly when it costs most, which is why mocks are essential not optional.

**"A mock where you solve the problem went well"** ? Mock feedback should assess the PROCESS (communication, approach, testing, hint-handling) not just whether you solved it ([14_MM interview-thinking]): the solved-in-silence mock (the [14_MM] silent-solution that would score below a narrated-partial), the solved-but-with-poor-communication, the solved-but-only-with-heavy-hints-not-acknowledged. "Solved therefore went well" misses what mocks are FOR � the value is the feedback on the process (did you clarify, narrate, test, integrate hints � the [14_MM] rubric-behaviors), and a mock where you solved the problem with poor process taught you less than a mock where you struggled but got specific feedback on the communication and approach, which is why the effective mock has a debrief on the PROCESS (the rubric dimensions) not just a did-you-get-the-answer verdict.

**"More mocks is better preparation"** ? Mock QUALITY (realistic, with specific actionable feedback) beats quantity, and mocks without good feedback just rehearse existing habits ([09_Career/12, 05_Problem_Solving/14]): the mock with a skilled interviewer who gives specific feedback (the deliberate-practice that improves) versus the many mocks with vague or no feedback (the volume that entrenches habits � the [05_Problem_Solving/14] volume-without-reflection). "More mocks is better" is the quantity-trap � the [05_Problem_Solving/14] deliberate-practice applies: mocks improve you when they are realistic AND give specific feedback you act on (the communication tic identified and fixed, the process gap addressed), and doing many mocks without the feedback-and-adjustment loop rehearses your current level rather than raising it, which is why a few well-run mocks with good debriefs beat many mocks that just repeat the experience.

**"Mock interviews should only happen right before the real ones"** ? Mocks are most valuable as an ONGOING practice that surfaces and fixes gaps over time, not a last-minute cram ([09_Career/13 habits, 12 psychology]): the mock done weeks out that reveals a communication weakness you then have time to work on, versus the mock the night before that just confirms your anxiety. "Only right before" is the cram-timing that leaves no time to act on the feedback � the effective use is periodic mocks throughout preparation (surfacing the gaps early enough to fix them � the [13_DE Agile] fast-feedback applied to interview prep), because the mock's value is the feedback-and-improvement loop which needs time to work, and the last-minute-only mock provides feedback you cannot act on plus adds pre-interview anxiety, which is why mocks belong throughout the prep as a diagnostic-and-improvement tool, not as a final-week ritual.

**"Practicing with peers is as good as expert mocks"** ? Peer mocks are valuable AND have limits experts fill ([09_Career/15, code-review]): the peer who cannot assess senior-level design depth or give the calibrated feedback of someone who has interviewed candidates (the [code-review] calibrated-reviewer), the peer mock that is good for practicing the format-and-communication and weaker for the expert judgment. "As good as expert mocks" over-credits peers � peer mocks are genuinely useful (the format practice, the communication reps, the mutual learning) and have limits (the peer's own gaps, the missing calibration of an experienced interviewer), which is why the effective mix uses both (frequent peer mocks for the reps and communication practice, occasional expert mocks for the calibrated feedback and the senior-level assessment), and treating peer mocks as complete misses the expert calibration that reveals the gaps peers share and cannot see.
