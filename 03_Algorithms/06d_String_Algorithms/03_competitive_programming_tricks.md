# PART 15: Competitive Programming Tricks

> **Navigation**: [← String Algorithms Deep Dive](02_string_algorithms_deep_dive.md) | [Chapter overview](../06d_String_Algorithms.md) | [LeetCode Problem Categories Reference →](04_leetcode_problem_categories_reference.md)
> Page 3 of 5 in **Advanced Algorithm Patterns & Competitive Programming**


## Fast I/O

```java
import java.io.*;
import java.util.*;

public class FastIO {
    static BufferedReader br = new BufferedReader(
        new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(
        new BufferedOutputStream(System.out));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    static int nextInt() throws IOException {
        return Integer.parseInt(next());
    }

    static long nextLong() throws IOException {
        return Long.parseLong(next());
    }

    static double nextDouble() throws IOException {
        return Double.parseDouble(next());
    }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = nextInt();
        }

        // Process...

        out.println("Result");
        out.flush();
    }
}
```

## Modular Arithmetic Utilities

```java
public class ModUtils {
    static final long MOD = 1_000_000_007;

    // Modular exponentiation
    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) {
                result = (result * base) % mod;
            }
            base = (base * base) % mod;
            exp >>= 1;
        }
        return result;
    }

    // Modular inverse using Fermat's little theorem
    static long modInverse(long a, long mod) {
        return power(a, mod - 2, mod);
    }

    // nCr mod p
    static long nCr(int n, int r, long[] fact, long[] invFact) {
        if (r > n || r < 0) return 0;
        return (fact[n] * invFact[r] % MOD) * invFact[n - r] % MOD;
    }

    // Precompute factorials
    static void precomputeFactorials(int maxN, long[] fact, long[] invFact) {
        fact[0] = 1;
        for (int i = 1; i <= maxN; i++) {
            fact[i] = fact[i - 1] * i % MOD;
        }
        invFact[maxN] = modInverse(fact[maxN], MOD);
        for (int i = maxN - 1; i >= 0; i--) {
            invFact[i] = invFact[i + 1] * (i + 1) % MOD;
        }
    }

    // Lucas theorem for large n, r with small prime p
    static long lucasnCr(long n, long r, int p) {
        if (r == 0) return 1;
        return (lucasnCr(n / p, r / p, p) *
                smallnCr((int)(n % p), (int)(r % p), p)) % p;
    }

    static long smallnCr(int n, int r, int p) {
        if (r > n) return 0;
        long num = 1, den = 1;
        for (int i = 0; i < r; i++) {
            num = num * (n - i) % p;
            den = den * (i + 1) % p;
        }
        return num * power(den, p - 2, p) % p;
    }
}
```

## Coordinate Compression

```java
public class CoordinateCompression {
    public static int[] compress(int[] arr) {
        // Get unique sorted values
        Set<Integer> set = new TreeSet<>();
        for (int x : arr) set.add(x);

        // Create mapping
        Map<Integer, Integer> map = new HashMap<>();
        int idx = 0;
        for (int x : set) {
            map.put(x, idx++);
        }

        // Compress
        int[] compressed = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            compressed[i] = map.get(arr[i]);
        }

        return compressed;
    }

    // Example: Range queries with large values
    // Original: [1000000, 1, 999999]
    // Compressed: [2, 0, 1]
}
```

## Bit Manipulation Tricks

```java
public class BitTricks {
    // Count set bits (Brian Kernighan)
    static int countBits(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }

    // Check if power of 2
    static boolean isPowerOf2(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    // Get lowest set bit
    static int lowestSetBit(int n) {
        return n & (-n);
    }

    // Turn off lowest set bit
    static int turnOffLowest(int n) {
        return n & (n - 1);
    }

    // Check if i-th bit is set
    static boolean isBitSet(int n, int i) {
        return (n & (1 << i)) != 0;
    }

    // Set i-th bit
    static int setBit(int n, int i) {
        return n | (1 << i);
    }

    // Clear i-th bit
    static int clearBit(int n, int i) {
        return n & ~(1 << i);
    }

    // Toggle i-th bit
    static int toggleBit(int n, int i) {
        return n ^ (1 << i);
    }

    // Get highest set bit position
    static int highestSetBitPos(int n) {
        return 31 - Integer.numberOfLeadingZeros(n);
    }

    // Next permutation with same number of bits
    static int nextPermutation(int n) {
        int t = n | (n - 1);
        return (t + 1) | (((~t & -~t) - 1) >> (Integer.numberOfTrailingZeros(n) + 1));
    }

    // Iterate through all subsets of a bitmask
    static void iterateSubsets(int mask) {
        for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
            // Process subset
            System.out.println(Integer.toBinaryString(subset));
        }
    }
}
```

---

> 🔬 **Section Challenge — PART 15: Competitive Programming Tricks**

**Challenge 1 (Reasoning):** `modInverse(a, mod)` uses `power(a, mod - 2, mod)` (Fermat's little theorem). This only works when `mod` is prime. What happens if you call `modInverse(6, 12)` and why? What's the alternative for non-prime moduli?

<details><summary>Answer</summary>

Fermat's little theorem states `a^(p-1) ≡ 1 (mod p)` only when p is prime and `gcd(a, p) = 1`. For `modInverse(6, 12)`: `gcd(6, 12) = 6 ≠ 1`, so 6 has **no** multiplicative inverse mod 12. The function silently returns a wrong value. For non-prime moduli, use the **Extended Euclidean Algorithm**: compute `gcd(a, mod)` and if it equals 1, extract the inverse from the Bézout coefficients. If `gcd(a, mod) ≠ 1`, no inverse exists. In competitive programming, the modulus is almost always `10^9 + 7` (prime), so Fermat's is standard — but knowing _why_ it fails for composites separates understanding from memorization.

</details>

## PART 16: Algorithm Complexity Analysis Deep Dive

### Master Theorem Reference

```
MASTER THEOREM:
For T(n) = aT(n/b) + f(n) where a ≥ 1, b > 1

Case 1: f(n) = O(n^(log_b(a) - ε)) for some ε > 0
        → T(n) = Θ(n^(log_b(a)))

Case 2: f(n) = Θ(n^(log_b(a)) * log^k(n))
        → T(n) = Θ(n^(log_b(a)) * log^(k+1)(n))

Case 3: f(n) = Ω(n^(log_b(a) + ε)) for some ε > 0
        AND af(n/b) ≤ cf(n) for some c < 1
        → T(n) = Θ(f(n))

EXAMPLES:
```

| Recurrence | Solution |
| --- | --- |
| T(n) = 2T(n/2) + n | O(n log n) |
| T(n) = 2T(n/2) + 1 | O(n) |
| T(n) = 2T(n/2) + n² | O(n²) |
| T(n) = T(n/2) + 1 | O(log n) |
| T(n) = T(n/2) + n | O(n) |
| T(n) = 4T(n/2) + n | O(n²) |
| T(n) = 4T(n/2) + n² | O(n² log n) |
| T(n) = 3T(n/2) + n | O(n^1.585) |
| T(n) = T(n-1) + n | O(n²) |
| T(n) = T(n-1) + 1 | O(n) |
| T(n) = 2T(n-1) + 1 | O(2^n) |

### Amortized Analysis

```
AGGREGATE METHOD:
Sum all operations, divide by n.

ACCOUNTING METHOD:
Assign amortized cost to each operation.
Some pay more (save credit), some use saved credit.

POTENTIAL METHOD:
Define potential function Φ.
Amortized cost = actual cost + ΔΦ

EXAMPLE: Dynamic Array (ArrayList)
- Push when full: copy all elements + add new = O(n)
- Push when not full: add new = O(1)

Amortized Analysis:
- n pushes: 1 + 2 + 4 + 8 + ... + n copies
- Total copies ≈ 2n
- Amortized per push = O(1)

PROOF (Accounting Method):
- Charge 3 for each push
- 1 to insert current element
- 1 to move current element when array doubles
- 1 to move an element that was there before doubling
```

---

[← String Algorithms Deep Dive](02_string_algorithms_deep_dive.md) | [Chapter overview](../06d_String_Algorithms.md) | [LeetCode Problem Categories Reference →](04_leetcode_problem_categories_reference.md)
