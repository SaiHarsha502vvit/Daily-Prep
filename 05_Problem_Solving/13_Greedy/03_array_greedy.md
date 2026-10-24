# 12.2 Array Greedy

> **Navigation**: [← 12.1 Interval Problems](02_interval_problems.md) | [Chapter overview](../13_Greedy.md) | [12.3 String Greedy →](04_string_greedy.md)
> Page 3 of 4 in **Greedy**


**Pattern:** Scan the array maintaining a greedy invariant (farthest jump, surplus gas, candy needed).
**Jump Game strategy:** Track `farthest = max(farthest, i + nums[i])`. If you can reach end → true.
**Gas Station:** Total gas ≥ total cost → solution exists. Start from the point where deficit resets.

## Problem 194: Jump Game

**LeetCode 55** 🔗 https://leetcode.com/problems/jump-game/

**Jump Game: can you reach the last index?**

`nums = [2, 3, 1, 1, 4]`.

| Index | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| Value | 2 | 3 | 1 | 1 | 4 |

- From index 0 you can jump to index 1 or 2.
- From index 1 you can reach index 4 (the last index).

Output: **true**. Greedy idea: track the maximum reachable index.

**Solution:**

```java
public boolean canJump(int[] nums) {
    int maxReach = 0;

    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // Can't reach this index
        maxReach = Math.max(maxReach, i + nums[i]);
        if (maxReach >= nums.length - 1) return true;
    }

    return true;
}
```

---

## Problem 195: Jump Game II

**LeetCode 45** 🔗 https://leetcode.com/problems/jump-game-ii/

**JUMP GAME II - Minimum jumps to reach end**

```text
nums = [2, 3, 1, 1, 4]

Jump 1: 0 → 1 (jump to index 1)
Jump 2: 1 → 4 (jump to index 4)

Output: 2 jumps

Greedy: BFS-like level traversal
```

**Solution:**

```java
public int jump(int[] nums) {
    int jumps = 0;
    int currentEnd = 0;    // End of current jump range
    int farthest = 0;      // Farthest we can reach

    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);

        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }

    return jumps;
}
```

---

## Problem 196: Gas Station

**LeetCode 134** 🔗 https://leetcode.com/problems/gas-station/

**GAS STATION - Find starting station for circular trip**

```text
gas  = [1, 2, 3, 4, 5]
cost = [3, 4, 5, 1, 2]

Station: 0   1   2   3   4
net:    -2  -2  -2  +3  +3

Start at station 3:
3→4: tank = 4-1 = 3
4→0: tank = 3+5-2 = 6
0→1: tank = 6+1-3 = 4
1→2: tank = 4+2-4 = 2
2→3: tank = 2+3-5 = 0 ✓

Output: 3
```

**Solution:**

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalTank = 0;
    int currentTank = 0;
    int startStation = 0;

    for (int i = 0; i < gas.length; i++) {
        int net = gas[i] - cost[i];
        totalTank += net;
        currentTank += net;

        if (currentTank < 0) {
            // Can't reach station i+1 from startStation
            startStation = i + 1;
            currentTank = 0;
        }
    }

    return totalTank >= 0 ? startStation : -1;
}
```

---

## Problem 197: Candy

**LeetCode 135** 🔗 https://leetcode.com/problems/candy/

**CANDY - Min candies for ratings**

```text
ratings = [1, 0, 2]

Rules:
- Each child gets at least 1 candy
- Higher rating than neighbor → more candies than neighbor

Candies: [2, 1, 2]
Child 0: rating 1 > rating 0, gets 2
Child 1: lowest rating, gets 1
Child 2: rating 2 > rating 0, gets 2

Output: 5 total candies
```

**Solution:**

```java
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candies = new int[n];
    Arrays.fill(candies, 1);

    // Left to right: handle increasing ratings
    for (int i = 1; i < n; i++) {
        if (ratings[i] > ratings[i-1]) {
            candies[i] = candies[i-1] + 1;
        }
    }

    // Right to left: handle decreasing ratings
    for (int i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i+1]) {
            candies[i] = Math.max(candies[i], candies[i+1] + 1);
        }
    }

    int total = 0;
    for (int c : candies) total += c;
    return total;
}
```

---

🔬 **Section Challenge — 12.2 Array Greedy**

**Challenge 1 (Array Greedy — Gas Station):** LC 134: circular gas station. You can complete a circuit if `sum(gas) >= sum(cost)`. **Who** finds the start station? **What** is the greedy insight that makes O(n) possible without trying all starts?

<details><summary>Answer</summary>

**Greedy insight:** If you start at station `i` and run out of gas at station `j`, you CANNOT start at any station between `i` and `j`. Why? If starting at `i` fails at `j`, starting at any `k` between `i` and `j` means you SKIP the gas from stations `i` to `k-1`. Since those stations weren't enough to get you to `j+1` even WITH their gas contribution, having LESS gas from `k` onward certainly fails. **The algorithm:** Scan once. Track `total = sum(gas[i] - cost[i])` and `tank = current tank running balance`. If `tank < 0`, reset: set `start = i+1`, reset `tank = 0`. After full scan: if `total >= 0`, `start` is the answer (guaranteed unique). If `total < 0`, no solution. **Who finds the start:** The O(n) single-pass scan, resetting whenever we'd go negative. The key guarantee: if a solution exists, the last reset point is always the valid start. **This is greedy** because we make a local decision ("this station can't be the start") that permanently eliminates it without backtracking.

</details>

<details><summary>More detail</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

---

[← 12.1 Interval Problems](02_interval_problems.md) | [Chapter overview](../13_Greedy.md) | [12.3 String Greedy →](04_string_greedy.md)
