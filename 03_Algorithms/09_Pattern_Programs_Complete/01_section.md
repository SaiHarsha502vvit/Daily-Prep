# ═══════════════════════════════════════════════════════════

> **Navigation**: [Chapter overview](../09_Pattern_Programs_Complete.md) | [═══════════════════════════════════════════════════════════ →](02_section.md)
> Page 1 of 6 in **Complete Pattern Programs - From Zero to Hero**


## Pattern 1: Square

```
n = 5
* * * * *
* * * * *
* * * * *
* * * * *
* * * * *
```

```java
/**
 * WHY: Simplest pattern - understand nested loops
 * FORMULA:
 *   Rows = n
 *   Columns = n (constant)
 */
public static void square(int n) {
    for (int i = 0; i < n; i++) {           // n rows
        for (int j = 0; j < n; j++) {       // n columns each
            System.out.print("* ");
        }
        System.out.println();               // Next row
    }
}
```

---

## Pattern 2: Right Triangle (Increasing)

```
n = 5
*
* *
* * *
* * * *
* * * * *
```

```java
/**
 * WHY: Understand how inner loop depends on outer loop
 * FORMULA:
 *   Row i (0-indexed) → prints (i + 1) stars
 *   Row 0 → 1 star
 *   Row 4 → 5 stars
 */
public static void rightTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {      // j goes from 0 to i
            System.out.print("* ");
        }
        System.out.println();
    }
}

// ALTERNATE: Using 1-indexed
public static void rightTriangleAlt(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

---

## Pattern 3: Inverted Right Triangle

```
n = 5
* * * * *
* * * *
* * *
* *
*
```

```java
/**
 * WHY: Reverse thinking - start big, shrink
 * FORMULA:
 *   Row i (0-indexed) → prints (n - i) stars
 *   Row 0 → 5 stars
 *   Row 4 → 1 star
 */
public static void invertedRightTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) {   // (n - i) stars per row
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

---

## Pattern 4: Right-Aligned Triangle

```
n = 5
        *
      * *
    * * *
  * * * *
* * * * *
```

```java
/**
 * WHY: Learn leading spaces
 * FORMULA:
 *   Row i → (n - 1 - i) spaces, then (i + 1) stars
 *   Row 0 → 4 spaces, 1 star
 *   Row 4 → 0 spaces, 5 stars
 */
public static void rightAlignedTriangle(int n) {
    for (int i = 0; i < n; i++) {
        // Print leading spaces
        for (int j = 0; j < n - 1 - i; j++) {
            System.out.print("  ");         // 2 spaces to match "* "
        }
        // Print stars
        for (int j = 0; j <= i; j++) {
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

---

## Pattern 5: Inverted Right-Aligned Triangle

```
n = 5
* * * * *
  * * * *
    * * *
      * *
        *
```

```java
/**
 * FORMULA:
 *   Row i → i spaces, then (n - i) stars
 */
public static void invertedRightAligned(int n) {
    for (int i = 0; i < n; i++) {
        // Leading spaces
        for (int j = 0; j < i; j++) {
            System.out.print("  ");
        }
        // Stars
        for (int j = 0; j < n - i; j++) {
            System.out.print("* ");
        }
        System.out.println();
    }
}
```

---

## Pattern 6: Pyramid (Centered Triangle)

```
n = 5
        *
      * * *
    * * * * *
  * * * * * * *
* * * * * * * * *
```

```java
/**
 * WHY: Most asked pattern - combines spaces and stars
 * FORMULA:
 *   Row i → (n - 1 - i) spaces, then (2i + 1) stars
 *   Row 0 → 4 spaces, 1 star
 *   Row 2 → 2 spaces, 5 stars
 */
public static void pyramid(int n) {
    for (int i = 0; i < n; i++) {
        // Spaces
        for (int j = 0; j < n - 1 - i; j++) {
            System.out.print(" ");
        }
        // Stars
        for (int j = 0; j < 2 * i + 1; j++) {
            System.out.print("*");
        }
        System.out.println();
    }
}
```

---

## Pattern 7: Inverted Pyramid

```
n = 5
* * * * * * * * *
  * * * * * * *
    * * * * *
      * * *
        *
```

```java
/**
 * FORMULA:
 *   Row i → i spaces, then (2(n-i) - 1) stars
 */
public static void invertedPyramid(int n) {
    for (int i = 0; i < n; i++) {
        // Spaces
        for (int j = 0; j < i; j++) {
            System.out.print(" ");
        }
        // Stars
        for (int j = 0; j < 2 * (n - i) - 1; j++) {
            System.out.print("*");
        }
        System.out.println();
    }
}
```

---

## Pattern 8: Diamond

```
n = 5
        *
      * * *
    * * * * *
  * * * * * * *
* * * * * * * * *
  * * * * * * *
    * * * * *
      * * *
        *
```

```java
/**
 * WHY: Combines pyramid + inverted pyramid
 * HOW: Upper half (pyramid) + Lower half (inverted, skip first row)
 */
public static void diamond(int n) {
    // Upper half (including middle)
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) System.out.print("*");
        System.out.println();
    }
    // Lower half
    for (int i = n - 2; i >= 0; i--) {      // Start from n-2 to skip middle
        for (int j = 0; j < n - 1 - i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) System.out.print("*");
        System.out.println();
    }
}
```

---

## Pattern 9: Hollow Square

```
n = 5
* * * * *
*       *
*       *
*       *
* * * * *
```

```java
/**
 * WHY: Boundary vs interior logic
 * FORMULA: Print * only if i==0 OR i==n-1 OR j==0 OR j==n-1
 */
public static void hollowSquare(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 || i == n - 1 || j == 0 || j == n - 1) {
                System.out.print("* ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern 10: Hollow Pyramid

```
n = 5
        *
      *   *
    *       *
  *           *
* * * * * * * * *
```

```java
/**
 * FORMULA: Print * only on edges (first star, last star, or bottom row)
 */
public static void hollowPyramid(int n) {
    for (int i = 0; i < n; i++) {
        // Spaces
        for (int j = 0; j < n - 1 - i; j++) {
            System.out.print(" ");
        }
        // Stars and spaces
        for (int j = 0; j < 2 * i + 1; j++) {
            if (j == 0 || j == 2 * i || i == n - 1) {
                System.out.print("*");
            } else {
                System.out.print(" ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern 11: Hollow Diamond

```
n = 5
        *
      *   *
    *       *
  *           *
*               *
  *           *
    *       *
      *   *
        *
```

```java
public static void hollowDiamond(int n) {
    // Upper half
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) {
            if (j == 0 || j == 2 * i) System.out.print("*");
            else System.out.print(" ");
        }
        System.out.println();
    }
    // Lower half
    for (int i = n - 2; i >= 0; i--) {
        for (int j = 0; j < n - 1 - i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) {
            if (j == 0 || j == 2 * i) System.out.print("*");
            else System.out.print(" ");
        }
        System.out.println();
    }
}
```

---

## Pattern 12: Sandglass

```
n = 5
* * * * * * * * *
  * * * * * * *
    * * * * *
      * * *
        *
      * * *
    * * * * *
  * * * * * * *
* * * * * * * * *
```

```java
/**
 * WHY: Inverted pyramid + pyramid
 */
public static void sandglass(int n) {
    // Upper half (inverted pyramid)
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * (n - i) - 1; j++) System.out.print("*");
        System.out.println();
    }
    // Lower half (pyramid without first row)
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) System.out.print(" ");
        for (int j = 0; j < 2 * i + 1; j++) System.out.print("*");
        System.out.println();
    }
}
```

---

## Pattern 13: Arrow

```
n = 5
*
* *
* * *
* * * *
* * * * *
* * * *
* * *
* *
*
```

```java
/**
 * Right triangle + inverted right triangle (without repeat)
 */
public static void arrow(int n) {
    // Upper half
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
    // Lower half
    for (int i = n - 2; i >= 0; i--) {
        for (int j = 0; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern 14: Right Arrow

```
n = 5
*
  * *
    * * *
      * * * *
        * * * * *
      * * * *
    * * *
  * *
*
```

```java
public static void rightArrow(int n) {
    // Upper half
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) System.out.print("  ");
        for (int j = 0; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
    // Lower half
    for (int i = n - 2; i >= 0; i--) {
        for (int j = 0; j < i; j++) System.out.print("  ");
        for (int j = 0; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern 15: Plus Sign

```
n = 5 (must be odd for symmetry)
    *
    *
* * * * *
    *
    *
```

```java
public static void plusSign(int n) {
    int mid = n / 2;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == mid || j == mid) {
                System.out.print("* ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern X: Cross (X Shape)

```
n = 5
*       *
  *   *
    *
  *   *
*       *
```

```java
public static void cross(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == j || i + j == n - 1) {
                System.out.print("* ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

[Chapter overview](../09_Pattern_Programs_Complete.md) | [═══════════════════════════════════════════════════════════ →](02_section.md)
