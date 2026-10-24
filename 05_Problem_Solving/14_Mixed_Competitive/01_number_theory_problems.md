# 13.1 Number Theory Problems

> **Navigation**: [Chapter overview](../14_Mixed_Competitive.md) | [13.2 Bit Manipulation →](02_bit_manipulation.md)
> Page 1 of 5 in **SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS**


## Problem 202: Sieve of Eratosthenes (HackerEarth Classic)

```
┌────────────────────────────────────────────────────────────────┐
│  SIEVE OF ERATOSTHENES - Find all primes up to N               │
├────────────────────────────────────────────────────────────────┤
│  n = 30                                                        │
│                                                                │
│  Initial: 2  3  4  5  6  7  8  9 10 11 12 ... 30               │
│                                                                │
│  Mark multiples of 2: ✗4 ✗6 ✗8 ✗10 ✗12...                      │
│  Mark multiples of 3: ✗9 ✗15 ✗21 ✗27...                        │
│  Mark multiples of 5: ✗25...                                   │
│                                                                │
│  Primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29                    │
│                                                                │
│  Time: O(n log log n), Space: O(n)                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> sieveOfEratosthenes(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }

    List<Integer> primes = new ArrayList<>();
    for (int i = 2; i <= n; i++) {
        if (isPrime[i]) primes.add(i);
    }
    return primes;
}
```

---

## Problem 203: Prime Factorization (Codeforces Style)

```
┌────────────────────────────────────────────────────────────────┐
│  PRIME FACTORIZATION - Find all prime factors                  │
├────────────────────────────────────────────────────────────────┤
│  n = 84                                                        │
│                                                                │
│  84 ÷ 2 = 42                                                   │
│  42 ÷ 2 = 21                                                   │
│  21 ÷ 3 = 7                                                    │
│  7 ÷ 7 = 1                                                     │
│                                                                │
│  84 = 2² × 3 × 7                                               │
│                                                                │
│  Output: {2: 2, 3: 1, 7: 1}                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public Map<Integer, Integer> primeFactors(int n) {
    Map<Integer, Integer> factors = new HashMap<>();

    // Check for 2s
    while (n % 2 == 0) {
        factors.merge(2, 1, Integer::sum);
        n /= 2;
    }

    // Check odd factors
    for (int i = 3; i * i <= n; i += 2) {
        while (n % i == 0) {
            factors.merge(i, 1, Integer::sum);
            n /= i;
        }
    }

    // If n is still > 1, it's a prime factor
    if (n > 1) {
        factors.put(n, 1);
    }

    return factors;
}
```

---

## Problem 204: Modular Exponentiation (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  MODULAR EXPONENTIATION - Calculate (base^exp) % mod           │
├────────────────────────────────────────────────────────────────┤
│  base = 2, exp = 10, mod = 1000                                │
│                                                                │
│  Naive: 2^10 = 1024 → 1024 % 1000 = 24                         │
│                                                                │
│  Fast (Binary Exponentiation):                                 │
│  2^10 = 2^8 × 2^2 = 256 × 4 = 1024                             │
│                                                                │
│  10 in binary = 1010                                           │
│  2^1 = 2 (bit 1: skip)                                         │
│  2^2 = 4 (bit 2: use) → result = 4                             │
│  2^4 = 16 (bit 3: skip)                                        │
│  2^8 = 256 (bit 4: use) → result = 4 × 256 = 1024              │
│                                                                │
│  Time: O(log exp)                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public long modPow(long base, long exp, long mod) {
    long result = 1;
    base = base % mod;

    while (exp > 0) {
        // If exp is odd, multiply base with result
        if ((exp & 1) == 1) {
            result = (result * base) % mod;
        }

        // exp must be even now
        exp = exp >> 1;  // exp = exp / 2
        base = (base * base) % mod;
    }

    return result;
}
```

---

## Problem 205: GCD and LCM (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  GCD (Greatest Common Divisor) using Euclidean Algorithm       │
├────────────────────────────────────────────────────────────────┤
│  a = 48, b = 18                                                │
│                                                                │
│  48 = 18 × 2 + 12                                              │
│  18 = 12 × 1 + 6                                               │
│  12 = 6 × 2 + 0                                                │
│                                                                │
│  GCD(48, 18) = 6                                               │
│                                                                │
│  LCM(a, b) = (a × b) / GCD(a, b)                               │
│  LCM(48, 18) = 864 / 6 = 144                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

public long lcm(int a, int b) {
    return (long) a * b / gcd(a, b);
}

// GCD of array
public int gcdOfArray(int[] arr) {
    int result = arr[0];
    for (int i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
    }
    return result;
}
```

---

[Chapter overview](../14_Mixed_Competitive.md) | [13.2 Bit Manipulation →](02_bit_manipulation.md)
