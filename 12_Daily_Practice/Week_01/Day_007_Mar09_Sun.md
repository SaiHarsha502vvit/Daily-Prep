> **Navigation**: [< Previous](Day_006_Mar08_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)

# Day 007 - Sunday, March 9, 2026

> **Week 01** | **REVIEW DAY** | **Theme:** Consolidation + Re-attempt Weak Problems
> [Prev Day](Day_006_Mar08_Sat.md) | [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Next →](../Week_02/)

---

## Completion Checklist

- [ ] Morning: Re-attempt problems you found difficult (60 min)
- [ ] Afternoon: Write solutions from scratch for weak topics (60 min)
- [ ] Evening: Speed drill — timed mini-problems (60 min)

---

## MORNING SESSION: Re-Attempt (60 min)

### Instructions

1. Look at yesterday's self-assessment ratings
2. Pick the 2-3 topics where you scored lowest
3. Re-solve those problems **without looking at solutions**
4. If stuck for > 10 minutes, look at the hint (not the full solution)

### Problems to re-attempt (pick based on your weak areas):

#### If Arrays were weak:

**Problem A:** Given `arr = [4, 2, 7, 1, 8, 3]`, trace through Selection Sort manually. Write each pass on paper.

**Problem B:** Rotate `[1, 2, 3, 4, 5]` left by 2 using the reverse trick. Show each step.

#### If Sorting was weak:

**Problem C:** Trace Merge Sort for `[5, 1, 8, 3, 2]`. Draw the full split tree and merge phases.

**Problem D:** What is the best-case time for Insertion Sort? Why? Give an example array.

#### If Kadane's was weak:

**Problem E:** Find the maximum subarray sum of `[3, -1, 2, -1, 5, -3]`. Show currentMax and globalMax at each step.

#### If Strings were weak:

**Problem F:** Check if "racecar" is a palindrome using two pointers. Show each comparison step.

**Problem G:** Build the frequency array for "banana". What does each position represent?

---

## AFTERNOON SESSION: Write from Scratch (60 min)

### Challenge: Code these WITHOUT any reference

Code each of these in your IDE (or pen and paper). Only check the solutions after you're done.

**1. Binary Search (5 min)**

```
Input: sorted array, target value
Output: index of target, or -1
```

<details>
<summary>Verify your solution</summary>

```java
int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

</details>

**2. Kadane's Algorithm (5 min)**

```
Input: integer array (can have negatives)
Output: maximum subarray sum
```

<details>
<summary>Verify your solution</summary>

```java
int maxSubArray(int[] nums) {
    int curr = nums[0], max = nums[0];
    for (int i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        max = Math.max(max, curr);
    }
    return max;
}
```

</details>

**3. Check Anagram (5 min)**

```
Input: two strings s and t
Output: true if anagram, false otherwise
```

<details>
<summary>Verify your solution</summary>

```java
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] freq = new int[26];
    for (int i = 0; i < s.length(); i++) {
        freq[s.charAt(i) - 'a']++;
        freq[t.charAt(i) - 'a']--;
    }
    for (int count : freq) if (count != 0) return false;
    return true;
}
```

</details>

**4. Merge Sort (10 min)**

```
Input: unsorted array
Output: sorted array
```

<details>
<summary>Verify your solution</summary>

```java
void mergeSort(int[] arr, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}

void merge(int[] arr, int l, int m, int r) {
    int[] temp = new int[r - l + 1];
    int i = l, j = m + 1, k = 0;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else temp[k++] = arr[j++];
    }
    while (i <= m) temp[k++] = arr[i++];
    while (j <= r) temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, l, temp.length);
}
```

</details>

**5. SQL: Create + Insert + Query (10 min)**
Write SQL to create an `employees` table with proper constraints, insert 3 rows, and find employees earning above average salary.

<details>
<summary>Verify your solution</summary>

```sql
CREATE TABLE employees (
    emp_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10, 2) NOT NULL CHECK (salary > 0),
    hire_date DATE
);

INSERT INTO employees (name, department, salary, hire_date) VALUES
    ('Alice', 'Engineering', 85000, '2024-01-15'),
    ('Bob', 'Engineering', 95000, '2023-06-01'),
    ('Charlie', 'Marketing', 70000, '2025-03-20');

-- Above average salary
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
-- Average = (85000+95000+70000)/3 = 83333.33
-- Returns: Alice (85000), Bob (95000)
```

</details>

---

## EVENING SESSION: Speed Drill (60 min)

### Timed Mini-Problems: 5 minutes each

Set a timer. If you can't solve in 5 minutes, mark it as "needs review" and move on.

**Speed 1:** Find the second largest element in an unsorted array. (No sorting allowed — single pass.)

<details>
<summary>Solution</summary>

```java
int secondLargest(int[] arr) {
    int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
    for (int num : arr) {
        if (num > first) { second = first; first = num; }
        else if (num > second && num != first) second = num;
    }
    return second;
}
```

</details>

**Speed 2:** Reverse a string without using built-in reverse functions.

<details>
<summary>Solution</summary>

```java
String reverse(String s) {
    char[] c = s.toCharArray();
    int l = 0, r = c.length - 1;
    while (l < r) { char t = c[l]; c[l++] = c[r]; c[r--] = t; }
    return new String(c);
}
```

</details>

**Speed 3:** Count how many times a target appears in a sorted array using binary search (O(log n)).

<details>
<summary>Solution</summary>

```java
int countOccurrences(int[] arr, int target) {
    int first = findFirst(arr, target);
    if (first == -1) return 0;
    int last = findLast(arr, target);
    return last - first + 1;
}
// findFirst/findLast from Day 1 — you should know this!
```

</details>

**Speed 4:** Write SQL to find the highest-priced product in each category.

<details>
<summary>Solution</summary>

```sql
SELECT category, MAX(price) as max_price
FROM products
GROUP BY category;
```

</details>

**Speed 5:** What is wrong with this code? Fix it.

```java
String s = "hello";
if (s == "hello") System.out.println("equal");
else System.out.println("not equal");
```

<details>
<summary>Answer</summary>

```java
// Could print either! With string pool, "hello" literal reuses same reference,
// so == might work. But it's WRONG practice.
// FIX: Always use .equals()
if (s.equals("hello")) System.out.println("equal");
// Or even safer (handles null):
if ("hello".equals(s)) System.out.println("equal");
```

</details>

**Speed 6:** Given `arr = [1, 2, 3, 4]`, what is the prefix sum array? What is `rangeSum(1, 3)`?

<details>
<summary>Answer</summary>

```
prefix = [1, 3, 6, 10]
rangeSum(1, 3) = prefix[3] - prefix[0] = 10 - 1 = 9
Verify: arr[1]+arr[2]+arr[3] = 2+3+4 = 9 ✓
```

</details>

---

## Week 1 Accomplishment Summary

### Topics Covered:

```
DATA STRUCTURES:  Arrays (1D + 2D), Strings, Subarrays
ALGORITHMS:       Selection Sort, Insertion Sort, Bubble Sort, Merge Sort,
                  Binary Search, Kadane's Algorithm
SQL:              CREATE, INSERT, UPDATE, DELETE, SELECT, Data Types,
                  Constraints, LIKE, BETWEEN, IN, NULL handling
SPRING BOOT:      Architecture, IoC/DI, Annotations, First CRUD API
PATTERNS:         Two Pointers, Frequency Array, Prefix Sum, Sliding Window,
                  Divide & Conquer, Reverse Trick
```

### Problems Solved: 10 coding + 9 SQL exercises + 6 speed drills = 25 total

### Key Algorithms to remember forever:

1. **Reverse trick** for array rotation
2. **Kadane's** for maximum subarray
3. **Frequency array** for character counting
4. **Binary search** on sorted data
5. **Two pointers** for converging from both ends

---

## Week 2 starts Monday (March 10):

**HashMap + LinkedList + Quick Sort — the next building blocks.**

> **Mentor Note:** Week 1 wasn't about mastering everything — it was about
> building the FOUNDATIONS. If you can trace through Merge Sort and write
> Kadane's from memory, you're ahead of 80% of candidates. Keep going.

---

> **Navigation**: [< Previous](Day_006_Mar08_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)
