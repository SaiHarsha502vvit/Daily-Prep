**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# Chapter 06 - Math & Geometry (Java Complete Guide)

Purpose: A complete Java reference for computational geometry and math problems, integrating advanced theorems from Skiena's _Programming Challenges_.

---

### Historical Evolution

Computational geometry's foundational algorithms trace to early cartography and surveying. The **Shoelace formula** (used for polygon area) was known to **Carl Friedrich Gauss and earlier mathematicians** but was popularized for digital computation by **M. Shamos in 1978** at Yale, who showed it could be computed in $O(n)$ for any simple polygon. The formula's name derives from the visual pattern of cross-products forming a zig-zag like a shoelace when drawn on paper. **Pick's Theorem** (area = interior + boundary/2 - 1 for lattice polygons) was published by **Georg Pick in 1899**, predating computers by nearly a century yet directly applicable to integer-coordinate polygon area problems in computational geometry. The **Cross Product / CCW test** is the geometric counterpart of determinant computation, a concept understood since **Leibniz (1687)** and formalized by **Euler (1776)** in the study of oriented areas. **Convex Hull algorithms** evolved from gift-wrapping (Jarvis 1973) and Graham scan (1972) to the **Quickhull (Barber, Dobkin, Huhdanpaa 1996)** algorithm, now implemented in virtually every GIS and game physics engine. Modern practice (post-2010) applies these theorems in autonomous vehicle path planning, computer graphics (collision detection via Separating Axis Theorem), and CAD systems.

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
