> **Navigation**: [← Game Theory — Nim, Grundy Numbers…](24_Game_Theory_Nim_Sprague_Grundy.md) | [Chapter index](00_INDEX.md) | [Advanced Data Structures →](07a_Advanced_DS_Core.md)

# Chapter 06 - Math & Geometry (Java Complete Guide)

Purpose: A complete Java reference for computational geometry and math problems, integrating advanced theorems from Skiena's _Programming Challenges_.

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Number Theory Core](08a_NumberTheory_Core.md), basic algebra |
| **You will learn** | Cross product and orientation, shoelace formula, Pick's theorem, precision pitfalls |
| **Leads to** | [Computational geometry](06e_Algorithm_Patterns.md) |
| **Abstraction level** | L5: geometry with integer arithmetic |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Math & Geometry

### 1. The bottom line

Most geometry tasks in interviews reduce to the sign of a cross product and careful integer arithmetic.

### 2. The textbook core

- `cross(a, b, c) > 0` means counter-clockwise turn, `< 0` clockwise, `0` collinear.
- Shoelace: polygon area = ½ |Σ (xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)|.
- Pick: `A = I + B/2 − 1` for lattice polygons.
- Prefer `long` integer math over `double` to avoid precision bugs.

### 3. The real-world analogy

Checking whether you must **turn left or right** at a corner: the cross product tells you without computing any angle.

### 4. Walkthrough

1. Points A(0,0), B(4,0), C(4,3).
2. `cross = (B−A) × (C−A) = 4·3 − 0·4 = 12 > 0`.
3. Positive → counter-clockwise turn.
4. Triangle area = |12| / 2 = 6.

> [!NOTE]
> **Quick check:** Why avoid floating point for orientation tests? *Rounding can flip the sign for nearly collinear points.*

---


### Historical Evolution

Computational geometry's foundational algorithms trace to early cartography and surveying. The **Shoelace formula** (used for polygon area) was described by **Albrecht Ludwig Friedrich Meister (1769)** and **Gauss (1795)**, and computes the area of any simple polygon in $O(n)$. The formula's name derives from the visual pattern of cross-products forming a zig-zag like a shoelace when drawn on paper. **Pick's Theorem** (area = interior + boundary/2 - 1 for lattice polygons) was published by **Georg Pick in 1899**, predating computers by nearly a century yet directly applicable to integer-coordinate polygon area problems in computational geometry. The **cross product / CCW test** is the sign of a 2×2 determinant (twice the signed area of a triangle); the vector cross product in its modern form comes from **Gibbs and Heaviside (1880s)**. **Convex Hull algorithms** evolved from gift-wrapping (Jarvis 1973) and Graham scan (1972) to the **Quickhull (Barber, Dobkin, Huhdanpaa 1996)** algorithm, now implemented in virtually every GIS and game physics engine. Modern practice (post-2010) applies these theorems in autonomous vehicle path planning, computer graphics (collision detection via Separating Axis Theorem), and CAD systems.


### 5. Check yourself

**Q1.** What does the sign of the cross product `(b−a) × (c−a)` tell you?

<details><summary>Answer</summary>

The orientation of `a, b, c`: positive means a counter-clockwise turn, negative clockwise, zero collinear.

</details>

**Q2.** Area of the triangle `(0,0), (4,0), (0,3)`?

<details><summary>Answer</summary>

**6**.

</details>

---

## 1. The Cross Product (CCW Test)

The most fundamental operation in computational geometry is determining the orientation of three points: $A$, $B$, and $C$. Do they turn left (counter-clockwise), turn right (clockwise), or go straight (collinear)?

### The Math

We use the 2D Cross Product of vectors $AB$ and $AC$:
$$ \text{CrossProduct}(A, B, C) = (B.x - A.x) \times (C.y - A.y) - (B.y - A.y) \times (C.x - A.x) $$

- **Positive (> 0):** Counter-Clockwise (Left turn)
- **Negative (< 0):** Clockwise (Right turn)
- **Zero (== 0):** Collinear

### Java Implementation

```java
class Point {
    long x, y;
    Point(long x, long y) { this.x = x; this.y = y; }
}

public static int orientation(Point a, Point b, Point c) {
    long crossProduct = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (crossProduct == 0) return 0;  // collinear
    return (crossProduct > 0) ? 1 : -1; // 1 for CCW, -1 for CW
}
```

> **Why it matters:** The CCW test is the building block for line segment intersection checks and finding the Convex Hull (Graham Scan algorithm). Using `long` avoids overflow!

---

## 2. The Shoelace Theorem (Polygon Area)

How do you find the area of an arbitrary simple polygon?

### The Math

If a polygon has vertices $(x_1, y_1), (x_2, y_2), \dots, (x_n, y_n)$ in order (clockwise or counter-clockwise), its area is half the absolute value of the sum of cross products of adjacent vertices.

$$ \text{Area} = \frac{1}{2} \left| \sum*{i=1}^{n-1} (x_i y*{i+1} - x\_{i+1} y_i) + (x_n y_1 - x_1 y_n) \right| $$

### Java Implementation

```java
public static double polygonArea(Point[] p) {
    long area = 0;
    int n = p.length;
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n; // wraps around to 0 for the last edge
        area += (p[i].x * p[j].y) - (p[j].x * p[i].y);
    }
    return Math.abs(area) / 2.0;
}
```

> **Why it matters:** This $O(N)$ algorithm avoids triangulating the polygon, which can be computationally expensive and prone to floating-point errors.

---

## 3. Pick's Theorem

This is a beautiful theorem often used in competitive programming (Skiena/UVa) when dealing with grids (lattice points).

### The Math

For any simple polygon whose vertices lie on a regular grid (integer coordinates):

$$ \text{Area} = I + \frac{B}{2} - 1 $$

Where:

- $I$ = number of interior lattice points
- $B$ = number of boundary lattice points

### Deriving interior points ($I$)

Usually, you calculate the Area using the **Shoelace Theorem**. You calculate $B$ by finding the number of lattice points on each edge. Then you solve for $I$:
$$ I = \text{Area} - \frac{B}{2} + 1 $$

### Finding $B$ (Boundary Points)

The number of lattice points on a line segment between integer coordinates $(x_1, y_1)$ and $(x_2, y_2)$ is exactly:

$$ \text{Points} = \gcd(|x_1 - x_2|, |y_1 - y_2|) $$

_(Note: this doesn't include the starting point if you're summing over a polygon)._

### Java Implementation

```java
public static long gcd(long a, long b) {
    return b == 0 ? a : gcd(b, a % b);
}

// Given an array of polygon vertices, find number of interior integer points
public static long countInteriorPoints(Point[] p) {
    int n = p.length;
    long B = 0;

    // 1. Calculate boundary points B
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        B += gcd(Math.abs(p[i].x - p[j].x), Math.abs(p[i].y - p[j].y));
    }

    // 2. Calculate Area using Shoelace (but keep it multiplied by 2 to avoid floats)
    long doubleArea = 0;
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        doubleArea += (p[i].x * p[j].y) - (p[j].x * p[i].y);
    }
    doubleArea = Math.abs(doubleArea);

    // 3. Pick's Theorem: Area = I + B/2 - 1  =>  2*Area = 2*I + B - 2
    // Therefore: 2*I = 2*Area - B + 2  =>  I = (2*Area - B + 2) / 2
    return (doubleArea - B + 2) / 2;
}
```

> **Why it matters:** Pick's Theorem turns a complex geometrical counting problem into simple arithmetic. It is essential for Google Code Jam / ICPC grid problems.

---

### Topical Breadth

The three fundamental polygon area and orientation methods cover distinct problem shapes. CCW (orientation test) is a constant-time O(1) predicate used as a building block for all other algorithms; it tells you whether three points make a left turn, right turn, or lie on a line, with no precomputation needed. The Shoelace formula computes exact polygon area in O(n) time given the ordered vertex list — it works for any simple polygon but requires the vertices in traversal order and produces a real (floating-point or scaled integer) result. Pick's Theorem is a specialized O(1) formula that applies only when vertices are integer lattice points; it trades the generality of Shoelace for an elegant integer-only result useful in grid-based competitive programming problems. In practice, CCW and Shoelace are used together (Shoelace gives the area, and the sign of the cross product tells you orientation for ordering), while Pick's Theorem is reserved for lattice polygon problems where interior lattice point counting is the goal.

| Method            | Input              | Preprocessing                      | Time | Output                      | Constraint                               |
| ----------------- | ------------------ | ---------------------------------- | ---- | --------------------------- | ---------------------------------------- |
| CCW (Orientation) | 3 points           | None                               | O(1) | +1 / 0 / -1                 | Any coordinates (integer or float)       |
| Shoelace Formula  | n ordered vertices | None                               | O(n) | Real area (may be fraction) | Polygon must be simple; vertices ordered |
| Pick's Theorem    | Lattice polygon    | Shoelace (for area) + GCD per edge | O(n) | Integer interior count      | Vertices must be integer lattice points  |

The selection rule: use **CCW** when you need orientation checks (line intersection, convex hull). Use **Shoelace** when you have vertices and need the actual area value. Use **Pick's** when the problem explicitly mentions grid points and asks for interior lattice count — the trade-off is that Pick's requires integer coordinates, but delivers an exact integer answer where Shoelace might yield a half-integer.

## 4. Summary & Interview Tips

1. **Avoid floating point division** until the absolute last step. Compare cross products using `long` to check collinearity rather than computing slopes (which suffer from divide-by-zero and precision loss).
2. **Counter-Clockwise (CCW)** is your best friend.
3. When vertices are integer coordinates, the polygon's area is always either an integer or half an integer (e.g., $10.0$ or $10.5$).


---

## Proof Corner -- Cross Product for Orientation Test

**Claim**: For three points P1, P2, P3, the sign of the cross product (P2-P1) x (P3-P1) determines their orientation:

cross = (P2.x - P1.x) * (P3.y - P1.y) - (P2.y - P1.y) * (P3.x - P1.x)

- cross > 0: P1, P2, P3 are counter-clockwise (left turn at P2)
- cross < 0: clockwise (right turn at P2)
- cross = 0: collinear

**Proof**: The cross product of vectors u = P2-P1 and v = P3-P1 gives the signed area of the parallelogram spanned by u and v. Positive = CCW by the right-hand rule. The formula avoids floating-point division (unlike slope comparison), so it is exact for integer coordinates.

**Convex hull correctness (Graham scan)**: Sort by polar angle; maintain a stack where every three consecutive points make a left turn. When a right turn is detected, pop until left turns resume. The result is a convex polygon. Correctness follows because every discarded point is inside the convex hull of the remaining stack.

---

## When It Breaks -- Math and Geometry

**1. Floating-point slope comparison** -- computing slope as y/x introduces division and floating-point error. Two parallel lines may appear to intersect. Fix: use cross products (integer arithmetic for integer coordinates, no precision loss).

**2. Collinear point handling in convex hull** -- Graham scan with strict left-turn check omits collinear boundary points. With >= 0 check it includes them but requires careful handling at the start. Decide upfront: do you want collinear points on the hull?

**3. Angle wraparound in polar sort** -- sorting by atan2 angle groups points correctly but atan2 returns values in (-pi, pi]. Points at exactly -pi and pi are the same direction but compare unequal. Fix: treat the anchor point's angle as 0 and handle the wraparound explicitly.

**4. Integer overflow in geometry** -- for coordinates up to 10^9, cross product computation involves (x2-x1)*(y3-y1) which can reach 2*10^18, overflowing long (max ~9.2*10^18). Use long carefully; for coordinates > 10^9, switch to BigInteger or scale down.

---

## Section Challenge -- Math and Geometry

**Problem 1 (6 min)**: Given three points A(0,0), B(4,0), C(4,3), compute the cross product of AB x AC. What does the sign tell you about orientation?

<details><summary>Model Answer</summary>

AB = B - A = (4, 0). AC = C - A = (4, 3).

Cross product = AB.x * AC.y - AB.y * AC.x = 4*3 - 0*4 = 12 > 0.

Positive cross product: A, B, C are in counter-clockwise (CCW) order. If you walk from A to B to C, you turn left at B. This is the standard CCW orientation.

Note: the area of triangle ABC = |cross| / 2 = 12 / 2 = 6.

</details>

---

## Reference Anchor

**java.awt.geom and java.lang.Math for geometry**:
```java
// Exact integer cross product (no floating point):
static long cross(long ax, long ay, long bx, long by, long cx, long cy) {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    // Positive = CCW, Negative = CW, Zero = collinear
}

// GCD for fraction reduction and Bezout coefficients:
// java.math.BigInteger.gcd(BigInteger) -- handles arbitrary precision
BigInteger g = BigInteger.valueOf(48).gcd(BigInteger.valueOf(18)); // 6

// Modular exponentiation for number theory in geometry:
// java.math.BigInteger.modPow(exponent, modulus) -- O(log exponent) with Montgomery mult
BigInteger result = BigInteger.valueOf(3).modPow(BigInteger.valueOf(100), BigInteger.valueOf(1000000007));

// java.util.Arrays.sort for angular sort (by polar angle from anchor):
// Comparator using cross product -- avoids atan2 floating point:
// compare(P, Q): if cross(anchor, P, Q) > 0, P comes before Q (CCW order)
```

---

## Brute Force to Optimal -- Geometry Algorithms

| Problem | Brute Force | Time | Optimal | Time |
|---------|-------------|------|---------|------|
| Convex hull | Check all O(n^3) triples | O(n^3) | Graham Scan | O(n log n) |
| Closest pair of points | Check all O(n^2) pairs | O(n^2) | Divide & conquer | O(n log n) |
| Line segment intersection | Check all O(n^2) pairs | O(n^2) | Shamos-Hoey sweep | O(n log n) |
| Point in polygon | N/A (exact) | O(n) | O(n) ray casting | O(n) -- irreducible |
| Polygon area | Shoelace formula (exact) | O(n) | O(n) -- already optimal | O(n) |


---

## 🏢 Enterprise Lens — Math & Geometry

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | GIS and mapping, collision detection, CAD, computer graphics, delivery-zone geometry |
| **Failure modes** | Overflow in cross products; epsilon comparison mistakes; degenerate (collinear) cases |
| **Testing and verification** | Test collinear, duplicate and very large coordinates |

---

## Reality Check

**"Floating-point equality checks work with == operator"** → 0.1 + 0.2 == 0.3 is FALSE in IEEE 754 floating point because 0.1 and 0.2 have infinite binary representations that are rounded. Use Math.abs(a - b) < epsilon where epsilon is appropriate for your precision needs (typically 1e-9 for algorithmic problems). For financial calculations, use BigDecimal, never double.

**"Integer overflow is caught at runtime in Java"** → Java integer arithmetic silently wraps on overflow. Integer.MAX_VALUE + 1 equals Integer.MIN_VALUE with no exception. Multiplying two large ints for intermediate results (like in binary search: (low + high) / 2) can overflow. Use low + (high - low) / 2 instead, or use long for intermediate calculations.

**"GCD is straightforward with Euclid algorithm"** → Euclid GCD works for positive integers. Edge cases: GCD(0, n) = n (not 0), GCD(negative, positive) requires taking absolute values first, and GCD with Integer.MIN_VALUE causes overflow when negating. Java Math.gcd does not exist — you must implement it yourself or use BigInteger.gcd().

**"Geometry problems only need basic math"** → Computational geometry requires careful handling of: collinear points (three points on the same line break convex hull algorithms), degenerate cases (zero-area triangles, overlapping segments), and numerical precision (floating-point errors accumulate across operations). Use cross-product sign for orientation tests rather than angle calculations to avoid trigonometric precision issues.

**"Modular arithmetic is just using the percent operator"** → Java percent operator returns negative values for negative dividends: -7 % 3 equals -1, not 2. For correct modular arithmetic, use Math.floorMod(-7, 3) which returns 2. Also, modular exponentiation requires repeated squaring — naive power-then-mod overflows even with long. Use BigInteger.modPow() or implement fast exponentiation with mod at each step.
