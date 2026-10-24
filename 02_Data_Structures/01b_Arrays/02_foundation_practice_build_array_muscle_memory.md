# 🏋️ Part 3: Foundation Practice — Build Array Muscle Memory

> **Navigation**: [← 5W1H — Why This Chapter?](01_5w1h_why_this_chapter.md) | [Chapter overview](../01b_Arrays.md) | [Sub Arrays — From Brute Force to Mastery →](03_sub_arrays_from_brute_force_to.md)
> Page 2 of 7 in **Arrays**


💡 **Learning path:** Walk through these before touching patterns. They train loop instincts and set up every concept that follows.

## 📦 Group A — Traversal Basics

**Q1 — Declare & Print All Elements**

```java
int[] arr = {10, 20, 30, 40, 50};
for (int i = 0; i < arr.length; i++)
    System.out.print(arr[i] + " ");   // 10 20 30 40 50
```

**Q2 — Read From User**

```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
int[] arr = new int[n];
for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
```

**Q3 — Print All EVEN Numbers** — O(n) _(already optimal — must check each element)_

```java
for (int x : arr) if (x % 2 == 0) System.out.print(x + " ");
```

❓ Why can't we do better than O(n)? Because we must inspect every element at least once.

**Q4 — Sum of Odd Numbers**

```java
int sum = 0;
for (int x : arr) if (x % 2 != 0) sum += x;
```

**Q5 — Average of All Elements**

```java
int sum = 0;
for (int x : arr) sum += x;
double avg = (double) sum / arr.length;
```

**Q6 — Average of Prime Numbers in Array**

```java
boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}
// In main:
int sum = 0, count = 0;
for (int x : arr) if (isPrime(x)) { sum += x; count++; }
double primeAvg = count > 0 ? (double)sum/count : 0;
```

💡 `i * i <= n` is the √n optimization — O(√n) instead of O(n) per check.

**Q7 — Print in Reverse Order** _(just print, don't rearrange)_

```java
for (int i = arr.length - 1; i >= 0; i--)
    System.out.print(arr[i] + " ");
// {11,34,67} → 67 34 11
```

**Q8 — Sum of First + Last Element**

```java
int result = arr[0] + arr[arr.length - 1];
```

**Q9 — Swap Every Two Adjacent Elements**

```
Input:  {8,7,5,1,5,2,6}
Output: {7,8,1,5,2,5,6}   ← pairs (0,1),(2,3),(4,5) swapped; last stays if odd length
```

```java
for (int i = 0; i + 1 < arr.length; i += 2) {
    int tmp = arr[i]; arr[i] = arr[i+1]; arr[i+1] = tmp;
}
```

**Q10 — Print Alternative Elements**

```java
for (int i = 0; i < arr.length; i += 2)
    System.out.print(arr[i] + " ");
```

**Q11 — Sum Up to Given Index K** _(prefix sum preview!)_

```java
int k = 3, sum = 0;
for (int i = 0; i <= k; i++) sum += arr[i];
```

💡 If you need this for many K values, computing each time = O(n) per query.
**Prefix Sum** (Part 13) makes it O(1) per query after O(n) build.

---

## 📦 Group B — Min / Max First Look

**Q12 — Find Biggest Element**

```java
int max = arr[0];
for (int x : arr) if (x > max) max = x;
// O(n) — optimal (must look at every element at least once)
```

**Q13 — Find Smallest Element**

```java
int min = arr[0];
for (int x : arr) if (x < min) min = x;
```

**Q14 — Find Second Highest Element**

```
Brute: Sort descending → arr[1]   O(n log n)
Better: Two-variable single pass   O(n)
```

```java
int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
for (int x : arr) {
    if (x > first)       { second = first; first = x; }
    else if (x > second) { second = x; }
}
```

**Q15 — Count Numbers Below Key Value**

```java
int key = 10, count = 0;
for (int x : arr) if (x < key) count++;
```

---

## 📦 Group C — Pairs & Two Arrays

**Q16 — All Pairs Summing to Target K** _(Two Sum brute force)_

```
Input: {4,6,18,10,14,2}, target=20 → Output: {6,14}, {18,2}
```

```java
// Brute: O(n²)
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (arr[i] + arr[j] == k)
            System.out.println("{" + arr[i] + "," + arr[j] + "}");
```

🧱 **You hit the wall** — for n=10⁶ this is 10¹² operations.
**HashMap reduces this to O(n)** — you'll apply that after learning HashMap (Part 10).

**Q17 — Sum of Same Position Values in Two Arrays**

```java
int[] a = {1,2,3}, b = {10,20,30};
for (int i = 0; i < a.length; i++)
    System.out.print((a[i] + b[i]) + " ");  // 11 22 33
```

**Q18 — Merge Two Arrays**

```java
int[] merged = new int[a.length + b.length];
for (int i = 0; i < a.length; i++) merged[i] = a[i];
for (int i = 0; i < b.length; i++) merged[a.length + i] = b[i];
```

---

## 🎯 Practice Problems — Foundation Level

| Problem                                | Platform   | Difficulty | Concept          |
| -------------------------------------- | ---------- | ---------- | ---------------- |
| LC 1929 — Concatenation of Array       | LeetCode   | ⭐ Easy    | Array building   |
| LC 2011 — Final Value After Operations | LeetCode   | ⭐ Easy    | Simple traversal |
| LC 1512 — Number of Good Pairs         | LeetCode   | ⭐ Easy    | Nested loops     |
| CF 4A — Watermelon                     | Codeforces | Div2-A     | Simple math      |
| CF 158A — Next Round                   | Codeforces | Div2-A     | Linear scan      |

🌟 **Goal:** Solve all 5 before moving to Sub Arrays. These cement loop instincts.

---

## 🎯 LeetCode Problems → Real-World Connection

### Problem: Two Sum

🏦 **Real-World Origin:** Financial Trading System (1990s)

**Problem at Goldman Sachs:**

- Traders needed to find **pairs of stocks** where Stock A + Stock B = Target budget
- Thousands of stocks, **milliseconds** to decide

**Before Optimization:**

```
for each stock A:
    for each stock B:
        if A + B == target: found!
```

Time: **O(n²)** — too slow for real-time trading!

**Solution — The Thinking Process:**

1. "We're checking the same pairs multiple times"
2. "What if we **remember** what we've seen?"
3. "**HashMap!** Store value → index"
4. "For each stock, check if the complement exists"

✅ **After:** O(n) time complexity → real-time trading possible. This **HashMap complement** pattern is now used in ALL trading systems.

---

[← 5W1H — Why This Chapter?](01_5w1h_why_this_chapter.md) | [Chapter overview](../01b_Arrays.md) | [Sub Arrays — From Brute Force to Mastery →](03_sub_arrays_from_brute_force_to.md)
