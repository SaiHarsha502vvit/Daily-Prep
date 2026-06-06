**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# Chapter 06 - Math & Geometry (Java Complete Guide)

Purpose: A complete Java reference for computational geometry and math problems, integrating advanced theorems from Skiena's *Programming Challenges*.

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

$$ \text{Area} = \frac{1}{2} \left| \sum_{i=1}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) + (x_n y_1 - x_1 y_n) \right| $$

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
*(Note: this doesn't include the starting point if you're summing over a polygon).*

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

## 4. Summary & Interview Tips

1. **Avoid floating point division** until the absolute last step. Compare cross products using `long` to check collinearity rather than computing slopes (which suffer from divide-by-zero and precision loss).
2. **Counter-Clockwise (CCW)** is your best friend. 
3. When vertices are integer coordinates, the polygon's area is always either an integer or half an integer (e.g., $10.0$ or $10.5$).
