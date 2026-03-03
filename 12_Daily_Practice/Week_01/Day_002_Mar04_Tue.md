# Day 002 - Tuesday, March 4, 2026

> **Week 01** | **Difficulty:** EASY | **Theme:** Array Operations + Insertion Sort + SQL Data Types
> [Prev Day](Day_001_Mar03_Mon.md) | [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Next Day](Day_003_Mar05_Wed.md)

---

## Completion Checklist

- [ ] DS: Array operations — rotate, merge, prefix sum (30 min)
- [ ] ALGO: Insertion Sort deep dive + stability concept (30 min)
- [ ] COMBO: Merge two sorted arrays (20 min)
- [ ] REAL: E-commerce cart calculation scenario (20 min)
- [ ] SQL: Data types + constraints + INSERT variations (40 min)
- [ ] Q1: Coding problem 1 (20 min)
- [ ] Q2: Coding problem 2 (20 min)

---

## BLOCK 1: DATA STRUCTURE (30 min)

### Topic: Array Operations — Rotate, Prefix Sum, Merge

#### WHY do these operations matter?
Array rotation appears in scheduling systems (rotating shifts), circular buffers (network packet processing). Prefix sum is the foundation of range queries used in databases and financial calculations. Merging sorted arrays is the core of Merge Sort.

#### WHAT are the key operations?

**1. Array Rotation**
```
LEFT ROTATE by 2:
  [1, 2, 3, 4, 5] → [3, 4, 5, 1, 2]

  Method 1: Copy (O(n) space)
  Method 2: Reverse trick (O(1) space)
    Step 1: Reverse first k elements:   [2, 1, 3, 4, 5]
    Step 2: Reverse remaining elements: [2, 1, 5, 4, 3]
    Step 3: Reverse entire array:       [3, 4, 5, 1, 2]

RIGHT ROTATE by 2:
  [1, 2, 3, 4, 5] → [4, 5, 1, 2, 3]
    Step 1: Reverse entire array:       [5, 4, 3, 2, 1]
    Step 2: Reverse first k elements:   [4, 5, 3, 2, 1]
    Step 3: Reverse remaining elements: [4, 5, 1, 2, 3]
```

**2. Prefix Sum**
```
WHAT: prefix[i] = sum of arr[0..i]

arr    = [3, 1, 4, 1, 5, 9]
prefix = [3, 4, 8, 9, 14, 23]

WHY? Range sum in O(1):
  sum(arr[2..4]) = prefix[4] - prefix[1] = 14 - 4 = 10
  Verify: arr[2]+arr[3]+arr[4] = 4+1+5 = 10 ✓

WITHOUT prefix sum: range query = O(n) each time
WITH prefix sum: build once O(n), then each query O(1)
```

#### Code: Implement all three

```java
public class ArrayOperations {
    
    // 1. Rotate array left by k positions — O(n) time, O(1) space
    public static void rotateLeft(int[] arr, int k) {
        int n = arr.length;
        k = k % n;  // Handle k > n
        reverse(arr, 0, k - 1);
        reverse(arr, k, n - 1);
        reverse(arr, 0, n - 1);
    }
    
    private static void reverse(int[] arr, int start, int end) {
        while (start < end) {
            int temp = arr[start];
            arr[start] = arr[end];
            arr[end] = temp;
            start++;
            end--;
        }
    }
    
    // 2. Build prefix sum array
    public static int[] buildPrefixSum(int[] arr) {
        int[] prefix = new int[arr.length];
        prefix[0] = arr[0];
        for (int i = 1; i < arr.length; i++) {
            prefix[i] = prefix[i - 1] + arr[i];
        }
        return prefix;
    }
    
    // Range sum query using prefix sum
    public static int rangeSum(int[] prefix, int left, int right) {
        if (left == 0) return prefix[right];
        return prefix[right] - prefix[left - 1];
    }
    
    // 3. Merge two sorted arrays into one sorted array
    public static int[] mergeSorted(int[] a, int[] b) {
        int[] result = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        
        while (i < a.length && j < b.length) {
            if (a[i] <= b[j]) {
                result[k++] = a[i++];
            } else {
                result[k++] = b[j++];
            }
        }
        
        while (i < a.length) result[k++] = a[i++];
        while (j < b.length) result[k++] = b[j++];
        
        return result;
    }
}
```

---

## BLOCK 2: ALGORITHM (30 min)

### Topic: Insertion Sort Deep Dive + Stability

#### WHY care about stability?

```
STABLE SORT: Equal elements maintain their original order.

Example: Sort students by grade (ignore name):
  Original:  [(Alice, B), (Bob, A), (Charlie, B), (Diana, A)]
  
  STABLE sort by grade:
  [(Bob, A), (Diana, A), (Alice, B), (Charlie, B)]
  ↑ A's keep original order: Bob before Diana
  ↑ B's keep original order: Alice before Charlie
  
  UNSTABLE sort by grade (could produce):
  [(Diana, A), (Bob, A), (Charlie, B), (Alice, B)]
  ↑ Order among equals is NOT guaranteed

WHY THIS MATTERS:
  - Database sorting: "Sort by department, then by salary"
  - If department sort is stable, salary order within dept is preserved
  - Real example: Excel multi-column sort depends on stability
```

#### Insertion Sort — trace through carefully

```
arr = [5, 2, 4, 6, 1, 3]

Pass 1 (i=1): key=2, compare with 5
  5 > 2, shift 5 right: [5, 5, 4, 6, 1, 3]
  Insert 2 at pos 0:    [2, 5, 4, 6, 1, 3]

Pass 2 (i=2): key=4, compare with 5
  5 > 4, shift 5 right: [2, 5, 5, 6, 1, 3]
  2 < 4, stop
  Insert 4 at pos 1:    [2, 4, 5, 6, 1, 3]

Pass 3 (i=3): key=6, compare with 5
  5 < 6, stop (already in place)
  Result:                [2, 4, 5, 6, 1, 3]

Pass 4 (i=4): key=1, compare with 6, 5, 4, 2
  All shift right:       [2, 2, 4, 5, 6, 3]
  Insert 1 at pos 0:    [1, 2, 4, 5, 6, 3]

Pass 5 (i=5): key=3, compare with 6, 5, 4
  6, 5, 4 shift right:  [1, 2, 4, 4, 5, 6]
  2 < 3, stop
  Insert 3 at pos 2:    [1, 2, 3, 4, 5, 6]  DONE!
```

#### WHEN is Insertion Sort actually the BEST choice?

```
SURPRISE: Insertion Sort is OPTIMAL for:
  1. Small arrays (n < 10-15): Less overhead than quicksort
     → Java's Arrays.sort() uses insertion sort for n < 47!
  2. Nearly sorted arrays: O(n) best case
     → If only 1-2 elements are out of place, it's LINEAR
  3. Online sorting: Can sort as data arrives (streaming)
  4. Stable sorting needed with O(1) space
```

---

## BLOCK 3: COMBO (20 min)

### Problem: Merge Two Sorted Arrays In-Place (LC 88 variant)

You have two sorted arrays. `nums1` has extra space at the end to hold all elements. Merge `nums2` into `nums1` in-place.

```
nums1 = [1, 2, 3, 0, 0, 0], m = 3
nums2 = [2, 5, 6],           n = 3
Output: [1, 2, 2, 3, 5, 6]

KEY INSIGHT: Merge from the END to avoid overwriting!

  i=2(→3), j=2(→6), k=5
  Compare 3 vs 6: 6 is bigger → nums1[5]=6, j--, k--
  Compare 3 vs 5: 5 is bigger → nums1[4]=5, j--, k--
  Compare 3 vs 2: 3 is bigger → nums1[3]=3, i--, k--
  Compare 2 vs 2: equal       → nums1[2]=2, j--, k--
  j exhausted, remaining [1,2] already in place
  Result: [1, 2, 2, 3, 5, 6] ✓
```

<details>
<summary>Solution</summary>

```java
public void merge(int[] nums1, int m, int[] nums2, int n) {
    int i = m - 1, j = n - 1, k = m + n - 1;
    while (i >= 0 && j >= 0) {
        if (nums1[i] > nums2[j]) {
            nums1[k--] = nums1[i--];
        } else {
            nums1[k--] = nums2[j--];
        }
    }
    while (j >= 0) {
        nums1[k--] = nums2[j--];
    }
}
// Time: O(m+n) | Space: O(1)
// NOTE: We don't need "while (i >= 0)" because those elements
// are already in nums1 in the correct position!
```
</details>

---

## BLOCK 4: REAL-TIME SCENARIO (20 min)

### Scenario: Shopping Cart Price Calculator

**Problem:** Build a function for an e-commerce cart that calculates:
1. Subtotal (sum of all item prices)
2. Apply bulk discount: if customer buys 3+ of the same item, 10% off that item
3. Apply coupon: flat discount if total > threshold

**Think about data structures:**
- Array of items? HashMap of item→quantity? Both?

```java
public class ShoppingCart {
    // Item: {name, price, quantity}
    
    public static double calculateTotal(String[] items, double[] prices, int[] quantities, 
                                         double couponThreshold, double couponDiscount) {
        double subtotal = 0;
        
        for (int i = 0; i < items.length; i++) {
            double itemTotal = prices[i] * quantities[i];
            
            // Bulk discount: 10% off if quantity >= 3
            if (quantities[i] >= 3) {
                itemTotal *= 0.90;  // 10% discount
            }
            
            subtotal += itemTotal;
        }
        
        // Coupon discount
        if (subtotal >= couponThreshold) {
            subtotal -= couponDiscount;
        }
        
        return Math.round(subtotal * 100.0) / 100.0;  // Round to 2 decimal places
    }
}
```

**WHY is this a good exercise?** Every e-commerce company (Amazon, Flipkart, Swiggy) has exactly this kind of pricing engine. In production, it's more complex (tax rules, regional pricing, promotional stacking) but the CORE LOGIC is array traversal + conditional math.

---

## BLOCK 5: SQL (40 min)

### Topic: Data Types, Constraints, and INSERT Variations

#### WHAT types should you choose? (Decision framework)

```
CHOOSING THE RIGHT TYPE:

  Storing ages?        → TINYINT (0-255, 1 byte) — NOT INT (wastes 3 bytes)
  Storing money?       → DECIMAL(10,2) — NEVER FLOAT (precision errors!)
  Storing a name?      → VARCHAR(100) — NOT CHAR (wastes space on short names)
  Storing a password?  → CHAR(60) — bcrypt hash is always 60 chars
  Storing a country?   → CHAR(2) — ISO codes are always 2 chars (IN, US, UK)
  Storing created_at?  → TIMESTAMP — auto timezone conversion, 4 bytes
  Storing birthday?    → DATE — no time component needed
  Storing true/false?  → BOOLEAN — stored as TINYINT(1)
```

#### Practice: CREATE with constraints

```sql
-- Create a students table with proper constraints
CREATE TABLE students (
    student_id   INT PRIMARY KEY AUTO_INCREMENT,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    email        VARCHAR(100) UNIQUE NOT NULL,
    age          TINYINT CHECK (age >= 16 AND age <= 100),
    gpa          DECIMAL(3, 2) CHECK (gpa >= 0 AND gpa <= 4.0),
    department   VARCHAR(50) DEFAULT 'Undeclared',
    enrolled_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert single row
INSERT INTO students (first_name, last_name, email, age, gpa)
VALUES ('Harsha', 'Sai', 'harsha@example.com', 22, 3.8);

-- Insert multiple rows at once (more efficient!)
INSERT INTO students (first_name, last_name, email, age, gpa, department) VALUES
    ('Alice', 'Smith', 'alice@example.com', 20, 3.5, 'Computer Science'),
    ('Bob', 'Jones', 'bob@example.com', 21, 3.2, 'Mathematics'),
    ('Charlie', 'Brown', 'charlie@example.com', 19, 3.9, 'Computer Science'),
    ('Diana', 'Prince', 'diana@example.com', 22, 3.7, 'Physics');

-- Try to break constraints (these will FAIL — and that's good!)
-- INSERT INTO students (first_name, last_name, email, age) 
-- VALUES ('Test', 'User', NULL, 25);  -- FAILS: email is NOT NULL

-- INSERT INTO students (first_name, last_name, email, age, gpa) 
-- VALUES ('Test', 'User', 'test@example.com', 15, 3.0);  -- FAILS: age < 16
```

#### SQL Practice Questions

**Q1:** Write a query to find all Computer Science students with GPA above 3.5, sorted by GPA descending.

<details>
<summary>Answer</summary>

```sql
SELECT first_name, last_name, gpa 
FROM students 
WHERE department = 'Computer Science' AND gpa > 3.5 
ORDER BY gpa DESC;
```
</details>

**Q2:** Write an INSERT that would violate the UNIQUE constraint on email. What error would you expect?

<details>
<summary>Answer</summary>

```sql
INSERT INTO students (first_name, last_name, email, age, gpa)
VALUES ('Fake', 'User', 'harsha@example.com', 20, 3.0);
-- ERROR: Duplicate entry 'harsha@example.com' for key 'email'
-- The UNIQUE constraint prevents two rows with the same email
```
</details>

**Q3 (Challenge):** Write a query to find departments that have more than 1 student. (Hint: you'll need GROUP BY and HAVING — preview of Week 3!)

<details>
<summary>Answer</summary>

```sql
SELECT department, COUNT(*) as student_count
FROM students
GROUP BY department
HAVING COUNT(*) > 1;
-- Returns: Computer Science (2 students)
```
</details>

> **Read more:** [08_SQL/02_DataTypes_Constraints.md](../../08_SQL/02_DataTypes_Constraints.md)

---

## BLOCK 6: CODING PROBLEMS (40 min)

### Q1: LC 189 — Rotate Array (Medium)

Given an integer array `nums`, rotate the array to the right by `k` steps.

```
Input: nums = [1,2,3,4,5,6,7], k = 3
Output: [5,6,7,1,2,3,4]
```

**Three approaches:**
1. Extra array: copy to new positions → O(n) time, O(n) space
2. Cyclic replacements → O(n) time, O(1) space (tricky)
3. Reverse trick → O(n) time, O(1) space (elegant)

<details>
<summary>Solution (Reverse trick)</summary>

```java
public void rotate(int[] nums, int k) {
    int n = nums.length;
    k = k % n;  // CRITICAL: k could be > n
    reverse(nums, 0, n - 1);      // Reverse all: [7,6,5,4,3,2,1]
    reverse(nums, 0, k - 1);      // Reverse first k: [5,6,7,4,3,2,1]
    reverse(nums, k, n - 1);      // Reverse rest: [5,6,7,1,2,3,4]
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}
```
</details>

---

### Q2: Maximum Sum Subarray of Size K (Not on LeetCode — Codeforces/HackerRank style)

Given an array and an integer k, find the maximum sum of any subarray of size k. (Uses your Sliding Window knowledge!)

```
Input: arr = [2, 1, 5, 1, 3, 2], k = 3
Output: 9 (subarray [5, 1, 3])
```

<details>
<summary>Solution</summary>

```java
public int maxSumSubarray(int[] arr, int k) {
    // Calculate sum of first window
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;
    
    // Slide the window
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];  // Add new, remove old
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
// Time: O(n) | Space: O(1)
// This is the CLASSIC fixed-size sliding window pattern!
```
</details>

---

## End of Day 2

### What you learned today:
1. **Array rotation** — the reverse trick (O(1) space)
2. **Prefix sum** — O(1) range queries after O(n) build
3. **Merge sorted arrays** — the two-pointer merge pattern
4. **Insertion Sort** — why it's optimal for small/nearly-sorted data
5. **Stability in sorting** — real impact on multi-column sorts
6. **SQL**: Data types (DECIMAL vs FLOAT!), constraints, INSERT
7. **Reinforced**: Sliding window pattern from your prior knowledge

### Tomorrow's Preview: Day 3 — Strings + Bubble Sort + SQL DDL Deep Dive

---

> **Mentor Note:** The reverse trick for array rotation is one of those "aha!" 
> moments. If you understood it, try to explain it to someone (or write it in 
> your own words). Teaching solidifies understanding.
