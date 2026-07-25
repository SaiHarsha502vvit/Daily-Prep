

---

## Reality Check

**"Floating-point geometry always works — just use doubles"** → Floating-point geometry breaks silently: `(0.1 + 0.2) == 0.3` is false. In geometry: two lines that should intersect at a point may appear to miss due to floating-point error. Three points that should be collinear test as non-collinear. The fix: use an epsilon (`Math.abs(a - b) < 1e-9`), or use integer arithmetic (scale coordinates to integers and use exact cross products). Competitive programming tip: if coordinates are integers ≤ 10^9, a 2D cross product fits in a `long` (use `long` not `int`).

**"Cross product is only for 3D"** → The 2D cross product of vectors (a, b) and (c, d) is `ad - bc` — a scalar. Its sign tells you the orientation: positive = counterclockwise turn, negative = clockwise, zero = collinear. Uses in 2D: convex hull (Graham scan and Jarvis march use CCW test), line intersection, point-in-polygon (half-plane tests), polygon area (shoelace formula is sum of cross products). The 2D cross product is one of the most useful operations in computational geometry.

**"Euclid's GCD algorithm is a simple recursive formula"** → `gcd(a, b) = gcd(b, a % b)`. The key insight for why it works: `gcd(a, b) = gcd(b, r)` where `r = a mod b`, because any common divisor of a and b also divides r = a - q*b, and vice versa. Correctness follows from this. Time complexity: O(log min(a,b)) — the Fibonacci sequence is the worst case (maximizes the number of steps). `lcm(a,b) = a / gcd(a,b) * b` (divide before multiplying to avoid overflow).

**"Modular arithmetic is only for cryptography"** → Modular arithmetic appears in: hash functions (index = hash % tableSize), random number generators (LCG: `Xₙ₊₁ = (aXₙ + c) mod m`), cyclic scheduling (day of week), competitive programming (large number answers mod 10^9+7 to prevent overflow), Bloom filters, consistent hashing (ring modulo). The properties that make it useful: all values stay bounded, addition/multiplication are closed under the modulus, and Fermat's little theorem enables modular inverse.

**"Sieve of Eratosthenes is just for learning"** → Sieve of Eratosthenes generates all primes up to n in O(n log log n). Production uses: generating prime numbers for hash table sizes, RSA key generation requires large primes (segment sieve for large ranges), primality testing in number theory applications, cryptographic libraries (NaCl, OpenSSL) contain prime generation code. Factorisation via primes: precompute primes up to √maxVal, then trial division is O(√n / ln√n) divisions per number.
