> **Navigation**: [< Previous](08_GCD_NumberTheory_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_Bit_Manipulation_Complete.md)

# ⭐ Complete Pattern Programs - From Zero to Hero

## Master Loop Logic Through Visual Patterns

---

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  WHY PATTERN PROGRAMS?                                                           ║
║                                                                                   ║
║  1. INTERVIEW REALITY: Asked in 90% of fresher interviews                        ║
║  2. BUILDS LOOP THINKING: Foundation for ALL DSA                                 ║
║  3. TEACHES OBSERVATION: Any pattern = rows + columns + relationship             ║
║  4. REAL APPLICATIONS:                                                           ║
║     • UI grids (game boards, spreadsheets)                                       ║
║     • Image processing (pixel manipulation)                                      ║
║     • Matrix transformations                                                     ║
║     • Report formatting                                                          ║
║                                                                                   ║
║  START DATE: February 10, 2026                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# 🎯 THE PATTERN SOLVING FRAMEWORK

## Universal Approach for ANY Pattern

```
STEP 1: COUNT ROWS
  → How many rows? = Outer loop count

STEP 2: FOR EACH ROW, IDENTIFY:
  → Spaces before content (leading spaces)
  → Content (stars, numbers, characters)
  → Spaces after content (sometimes needed)
  → Relationship with row number (i)

STEP 3: FIND THE FORMULA
  → Leading spaces = f(i, n)
  → Content count = g(i, n)
  → What to print = h(i, j)

STEP 4: CODE THE LOOPS
  → Outer loop for rows
  → Inner loop(s) for columns
```

---

# ═══════════════════════════════════════════════════════════

# PART 1: BASIC STAR PATTERNS (15 Patterns)

# ═══════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════

# PART 2: NUMBER PATTERNS (15 Patterns)

# ═══════════════════════════════════════════════════════════

## Pattern N1: Number Triangle (Row Number)

```
n = 5
1
2 2
3 3 3
4 4 4 4
5 5 5 5 5
```

```java
/**
 * Row i prints (i+1) i times
 */
public static void numberTriangleRow(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(i + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern N2: Number Triangle (Column Number)

```
n = 5
1
1 2
1 2 3
1 2 3 4
1 2 3 4 5
```

```java
/**
 * Row i prints 1 to i
 */
public static void numberTriangleCol(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(j + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern N3: Number Triangle Reverse

```
n = 5
5 4 3 2 1
4 3 2 1
3 2 1
2 1
1
```

```java
public static void numberTriangleReverse(int n) {
    for (int i = n; i >= 1; i--) {
        for (int j = i; j >= 1; j--) {
            System.out.print(j + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern N4: Floyd's Triangle

```
n = 5
1
2 3
4 5 6
7 8 9 10
11 12 13 14 15
```

```java
/**
 * WHY: Classic interview pattern
 * HOW: Single counter incrementing through all rows
 */
public static void floydsTriangle(int n) {
    int num = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(num + " ");
            num++;
        }
        System.out.println();
    }
}
```

---

## Pattern N5: Pascal's Triangle

```
n = 5
        1
      1   1
    1   2   1
  1   3   3   1
1   4   6   4   1
```

```java
/**
 * WHY: Mathematical significance (binomial coefficients)
 * FORMULA: Each element = nCr where n=row, r=column
 *          Or: element = previous element * (row - col) / col
 */
public static void pascalsTriangle(int n) {
    for (int i = 0; i < n; i++) {
        // Spacing
        for (int j = 0; j < n - 1 - i; j++) {
            System.out.print("  ");
        }

        int num = 1;
        for (int j = 0; j <= i; j++) {
            System.out.printf("%4d", num);
            num = num * (i - j) / (j + 1);  // nCr formula
        }
        System.out.println();
    }
}
```

---

## Pattern N6: Number Pyramid

```
n = 5
        1
      2 3 2
    3 4 5 4 3
  4 5 6 7 6 5 4
5 6 7 8 9 8 7 6 5
```

```java
public static void numberPyramid(int n) {
    for (int i = 1; i <= n; i++) {
        // Leading spaces
        for (int j = 1; j <= n - i; j++) {
            System.out.print("  ");
        }

        // Increasing part
        int num = i;
        for (int j = 1; j <= i; j++) {
            System.out.print(num + " ");
            num++;
        }

        // Decreasing part
        num -= 2;
        for (int j = 1; j < i; j++) {
            System.out.print(num + " ");
            num--;
        }

        System.out.println();
    }
}
```

---

## Pattern N7: Palindrome Number Triangle

```
n = 5
        1
      1 2 1
    1 2 3 2 1
  1 2 3 4 3 2 1
1 2 3 4 5 4 3 2 1
```

```java
public static void palindromeTriangle(int n) {
    for (int i = 1; i <= n; i++) {
        // Spaces
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        // Increasing
        for (int j = 1; j <= i; j++) System.out.print(j + " ");
        // Decreasing
        for (int j = i - 1; j >= 1; j--) System.out.print(j + " ");
        System.out.println();
    }
}
```

---

## Pattern N8: Binary Triangle (0-1 Pattern)

```
n = 5
1
0 1
1 0 1
0 1 0 1
1 0 1 0 1
```

```java
/**
 * Formula: If (i + j) is even → 1, else → 0
 */
public static void binaryTriangle(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            System.out.print(((i + j) % 2 == 0 ? 1 : 0) + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern N9: Zigzag Numbers

```
n = 5
1
3 2
4 5 6
10 9 8 7
11 12 13 14 15
```

```java
/**
 * WHY: Tests if you can alternate direction per row
 */
public static void zigzagNumbers(int n) {
    int num = 1;
    for (int i = 1; i <= n; i++) {
        int[] row = new int[i];

        // Fill array
        for (int j = 0; j < i; j++) {
            row[j] = num++;
        }

        // Print in correct order (reverse for even rows)
        if (i % 2 == 0) {
            for (int j = i - 1; j >= 0; j--) System.out.print(row[j] + " ");
        } else {
            for (int j = 0; j < i; j++) System.out.print(row[j] + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern N10: Number Diamond

```
n = 5
        1
      1 2 1
    1 2 3 2 1
  1 2 3 4 3 2 1
1 2 3 4 5 4 3 2 1
  1 2 3 4 3 2 1
    1 2 3 2 1
      1 2 1
        1
```

```java
public static void numberDiamond(int n) {
    // Upper half
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print(j + " ");
        for (int j = i - 1; j >= 1; j--) System.out.print(j + " ");
        System.out.println();
    }
    // Lower half
    for (int i = n - 1; i >= 1; i--) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print(j + " ");
        for (int j = i - 1; j >= 1; j--) System.out.print(j + " ");
        System.out.println();
    }
}
```

---

## Pattern N11: Multiplication Table

```
n = 5
1   2   3   4   5
2   4   6   8   10
3   6   9   12  15
4   8   12  16  20
5   10  15  20  25
```

```java
public static void multiplicationTable(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            System.out.printf("%-4d", i * j);
        }
        System.out.println();
    }
}
```

---

## Pattern N12: Prime Number Triangle

```
n = 5
2
3 5
7 11 13
17 19 23 29
31 37 41 43 47
```

```java
public static void primeTriangle(int n) {
    int num = 2;
    for (int i = 1; i <= n; i++) {
        int count = 0;
        while (count < i) {
            if (isPrime(num)) {
                System.out.print(num + " ");
                count++;
            }
            num++;
        }
        System.out.println();
    }
}

private static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}
```

---

## Pattern N13: Fibonacci Triangle

```
n = 5
0
1 1
2 3 5
8 13 21 34
55 89 144 233 377
```

```java
public static void fibonacciTriangle(int n) {
    int a = 0, b = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(a + " ");
            int next = a + b;
            a = b;
            b = next;
        }
        System.out.println();
    }
}
```

---

## Pattern N14: Square Number Pattern

```
n = 4
1 2 3 4
12 13 14 5
11 16 15 6
10 9 8 7
```

```java
/**
 * WHY: Tests 2D array manipulation (spiral filling)
 */
public static void spiralSquare(int n) {
    int[][] matrix = new int[n][n];
    int num = 1;
    int top = 0, bottom = n - 1, left = 0, right = n - 1;

    while (num <= n * n) {
        // Fill top row
        for (int j = left; j <= right && num <= n * n; j++) {
            matrix[top][j] = num++;
        }
        top++;

        // Fill right column
        for (int i = top; i <= bottom && num <= n * n; i++) {
            matrix[i][right] = num++;
        }
        right--;

        // Fill bottom row
        for (int j = right; j >= left && num <= n * n; j--) {
            matrix[bottom][j] = num++;
        }
        bottom--;

        // Fill left column
        for (int i = bottom; i >= top && num <= n * n; i--) {
            matrix[i][left] = num++;
        }
        left++;
    }

    // Print matrix
    for (int[] row : matrix) {
        for (int val : row) {
            System.out.printf("%-3d", val);
        }
        System.out.println();
    }
}
```

---

## Pattern N15: Number Box

```
n = 5
5 5 5 5 5 5 5 5 5
5 4 4 4 4 4 4 4 5
5 4 3 3 3 3 3 4 5
5 4 3 2 2 2 3 4 5
5 4 3 2 1 2 3 4 5
5 4 3 2 2 2 3 4 5
5 4 3 3 3 3 3 4 5
5 4 4 4 4 4 4 4 5
5 5 5 5 5 5 5 5 5
```

```java
/**
 * WHY: Classic interview question
 * FORMULA: Value at (i,j) = n - min(i, j, size-1-i, size-1-j)
 */
public static void numberBox(int n) {
    int size = 2 * n - 1;
    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            int minDist = Math.min(Math.min(i, j), Math.min(size - 1 - i, size - 1 - j));
            System.out.print((n - minDist) + " ");
        }
        System.out.println();
    }
}
```

---

# ═══════════════════════════════════════════════════════════

# PART 3: CHARACTER PATTERNS (10 Patterns)

# ═══════════════════════════════════════════════════════════

## Pattern C1: Alphabet Triangle

```
n = 5
A
A B
A B C
A B C D
A B C D E
```

```java
public static void alphabetTriangle(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            System.out.print((char)('A' + j) + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern C2: Alphabet Triangle (Same Letter)

```
n = 5
A
B B
C C C
D D D D
E E E E E
```

```java
public static void sameLetterTriangle(int n) {
    for (int i = 0; i < n; i++) {
        char ch = (char)('A' + i);
        for (int j = 0; j <= i; j++) {
            System.out.print(ch + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern C3: Reverse Alphabet Triangle

```
n = 5
E D C B A
D C B A
C B A
B A
A
```

```java
public static void reverseAlphabetTriangle(int n) {
    for (int i = n; i >= 1; i--) {
        for (int j = i; j >= 1; j--) {
            System.out.print((char)('A' + j - 1) + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern C4: Alphabet Pyramid

```
n = 5
        A
      A B A
    A B C B A
  A B C D C B A
A B C D E D C B A
```

```java
public static void alphabetPyramid(int n) {
    for (int i = 1; i <= n; i++) {
        // Spaces
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        // Increasing
        for (int j = 0; j < i; j++) System.out.print((char)('A' + j) + " ");
        // Decreasing
        for (int j = i - 2; j >= 0; j--) System.out.print((char)('A' + j) + " ");
        System.out.println();
    }
}
```

---

## Pattern C5: Continuous Alphabet Triangle

```
n = 5
A
B C
D E F
G H I J
K L M N O
```

```java
public static void continuousAlphabet(int n) {
    char ch = 'A';
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(ch + " ");
            ch++;
            if (ch > 'Z') ch = 'A';  // Wrap around
        }
        System.out.println();
    }
}
```

---

## Pattern C6: Alphabet with Stars

```
n = 5, wraps after 'Z' to '*'
Row 1: A
Row 26: Z
Row 27: * (after Z)
Row 28: * *
...
```

```java
/**
 * WHY: Real interview question (handling boundary cases)
 */
public static void alphabetWithStars(int rows) {
    int charIndex = 0;  // 0 = 'A', 25 = 'Z'

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= i; j++) {
            if (charIndex < 26) {
                System.out.print((char)('A' + charIndex) + " ");
                charIndex++;
            } else {
                System.out.print("* ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern C7: Alphabet Diamond

```
n = 5
        A
      A B A
    A B C B A
  A B C D C B A
A B C D E D C B A
  A B C D C B A
    A B C B A
      A B A
        A
```

```java
public static void alphabetDiamond(int n) {
    // Upper half
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 0; j < i; j++) System.out.print((char)('A' + j) + " ");
        for (int j = i - 2; j >= 0; j--) System.out.print((char)('A' + j) + " ");
        System.out.println();
    }
    // Lower half
    for (int i = n - 1; i >= 1; i--) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 0; j < i; j++) System.out.print((char)('A' + j) + " ");
        for (int j = i - 2; j >= 0; j--) System.out.print((char)('A' + j) + " ");
        System.out.println();
    }
}
```

---

## Pattern C8: Sandglass Alphabet

```
n = 5
A B C D E D C B A
  A B C D C B A
    A B C B A
      A B A
        A
      A B A
    A B C B A
  A B C D C B A
A B C D E D C B A
```

```java
public static void alphabetSandglass(int n) {
    // Upper inverted pyramid
    for (int i = n; i >= 1; i--) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 0; j < i; j++) System.out.print((char)('A' + j) + " ");
        for (int j = i - 2; j >= 0; j--) System.out.print((char)('A' + j) + " ");
        System.out.println();
    }
    // Lower pyramid
    for (int i = 2; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 0; j < i; j++) System.out.print((char)('A' + j) + " ");
        for (int j = i - 2; j >= 0; j--) System.out.print((char)('A' + j) + " ");
        System.out.println();
    }
}
```

---

## Pattern C9: Word Pattern

```
Input: "CODE"
C
CO
COD
CODE
COD
CO
C
```

```java
public static void wordPattern(String word) {
    int n = word.length();

    // Upper half
    for (int i = 1; i <= n; i++) {
        System.out.println(word.substring(0, i));
    }
    // Lower half
    for (int i = n - 1; i >= 1; i--) {
        System.out.println(word.substring(0, i));
    }
}
```

---

## Pattern C10: Hollow Alphabet Triangle

```
n = 5
A
A B
A   C
A     D
A B C D E
```

```java
public static void hollowAlphabetTriangle(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            // First char, last char, or bottom row
            if (j == 1 || j == i || i == n) {
                System.out.print((char)('A' + j - 1) + " ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

# ═══════════════════════════════════════════════════════════

# PART 4: SPECIAL PATTERNS (10 Patterns)

# ═══════════════════════════════════════════════════════════

## Pattern S1: Heart Shape

```
  **   **
 **** ****
***********
 *********
  *******
   *****
    ***
     *
```

```java
public static void heartPattern(int n) {
    // Upper curves (two overlapping circles)
    for (int i = n / 2; i <= n; i += 2) {
        // Left spaces
        for (int j = 1; j < n - i; j += 2) System.out.print(" ");

        // Left curve
        for (int j = 1; j <= i; j++) System.out.print("*");

        // Middle space
        for (int j = 1; j <= n - i; j++) System.out.print(" ");

        // Right curve
        for (int j = 1; j <= i; j++) System.out.print("*");

        System.out.println();
    }

    // Lower triangle (inverted)
    for (int i = n; i >= 1; i--) {
        for (int j = i; j < n; j++) System.out.print(" ");
        for (int j = 1; j <= (i * 2) - 1; j++) System.out.print("*");
        System.out.println();
    }
}
```

---

## Pattern S2: Butterfly

```
n = 4
*            *
* *        * *
* * *    * * *
* * * ** * * *
* * * ** * * *
* * *    * * *
* *        * *
*            *
```

```java
public static void butterfly(int n) {
    // Upper half
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) System.out.print("* ");
        for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
    // Lower half
    for (int i = n; i >= 1; i--) {
        for (int j = 1; j <= i; j++) System.out.print("* ");
        for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern S3: Stairs

```
n = 5
        *
      * *
    * * *
  * * * *
* * * * *
```

```java
public static void stairs(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) System.out.print("  ");
        for (int j = 1; j <= i; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern S4: Chess Board

```
n = 8
* - * - * - * -
- * - * - * - *
* - * - * - * -
- * - * - * - *
* - * - * - * -
- * - * - * - *
* - * - * - * -
- * - * - * - *
```

```java
public static void chessBoard(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if ((i + j) % 2 == 0) {
                System.out.print("* ");
            } else {
                System.out.print("- ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern S5: Zero-One Box

```
n = 5
1 0 1 0 1
0 1 0 1 0
1 0 1 0 1
0 1 0 1 0
1 0 1 0 1
```

```java
public static void zeroOneBox(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            System.out.print(((i + j) % 2) + " ");
        }
        System.out.println();
    }
}
```

---

## Pattern S6: Triangle with Border

```
n = 5
    1
   1 1
  1   1
 1     1
1 1 1 1 1
```

```java
public static void triangleWithBorder(int n) {
    for (int i = 1; i <= n; i++) {
        // Leading spaces
        for (int j = 1; j <= n - i; j++) System.out.print(" ");

        // Content
        for (int j = 1; j <= i; j++) {
            if (j == 1 || j == i || i == n) {
                System.out.print("1 ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern S7: Rhombus

```
n = 5
        * * * * *
      * * * * *
    * * * * *
  * * * * *
* * * * *
```

```java
public static void rhombus(int n) {
    for (int i = n; i >= 1; i--) {
        // Spaces
        for (int j = 1; j < i; j++) System.out.print("  ");
        // Stars
        for (int j = 1; j <= n; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern S8: Parallelogram

```
n = 5
* * * * *
  * * * * *
    * * * * *
      * * * * *
        * * * * *
```

```java
public static void parallelogram(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j < i; j++) System.out.print("  ");
        for (int j = 1; j <= n; j++) System.out.print("* ");
        System.out.println();
    }
}
```

---

## Pattern S9: Number Frame

```
n = 5
1 2 3 4 5
2       4
3       3
4       2
5 4 3 2 1
```

```java
public static void numberFrame(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (i == 1) {
                System.out.print(j + " ");
            } else if (i == n) {
                System.out.print((n - j + 1) + " ");
            } else if (j == 1) {
                System.out.print(i + " ");
            } else if (j == n) {
                System.out.print((n - i + 1) + " ");
            } else {
                System.out.print("  ");
            }
        }
        System.out.println();
    }
}
```

---

## Pattern S10: Hourglass with Numbers

```
n = 5
1 2 3 4 5
  2 3 4
    3
  2 3 4
1 2 3 4 5
```

```java
public static void hourglassNumbers(int n) {
    // Upper half (shrinking)
    for (int i = 0; i < n; i += 2) {
        for (int j = 0; j < i / 2; j++) System.out.print("  ");
        for (int j = i / 2; j < n - i / 2; j++) System.out.print((j + 1) + " ");
        System.out.println();
    }

    // Lower half (growing)
    for (int i = n - 2 - (n % 2 == 0 ? 1 : 0); i >= 0; i -= 2) {
        for (int j = 0; j < i / 2; j++) System.out.print("  ");
        for (int j = i / 2; j < n - i / 2; j++) System.out.print((j + 1) + " ");
        System.out.println();
    }
}
```

---

# ═══════════════════════════════════════════════════════════

# PART 5: INTERVIEW PATTERN QUESTIONS

# ═══════════════════════════════════════════════════════════

## Q1: Print Triangle with Custom Character

```
Input: n=4, char='#'
Output:
#
# #
# # #
# # # #
```

```java
public static void customTriangle(int n, char c) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            System.out.print(c + " ");
        }
        System.out.println();
    }
}
```

---

## Q2: Print Pattern Based on Input String

```
Input: "ABABA"
Output:
A
AB
ABA
ABAB
ABABA
```

```java
public static void stringTriangle(String s) {
    for (int i = 1; i <= s.length(); i++) {
        System.out.println(s.substring(0, i));
    }
}
```

---

## Q3: Zigzag Pattern

```
Input: "PAYPALISHIRING", numRows=3
Output:
P   A   H   N
A P L S I I G
Y   I   R
```

```java
/**
 * WHY: LeetCode #6 - Classic interview question
 */
public static String zigzagConversion(String s, int numRows) {
    if (numRows == 1) return s;

    StringBuilder[] rows = new StringBuilder[numRows];
    for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();

    int row = 0;
    boolean goingDown = false;

    for (char c : s.toCharArray()) {
        rows[row].append(c);
        if (row == 0 || row == numRows - 1) goingDown = !goingDown;
        row += goingDown ? 1 : -1;
    }

    StringBuilder result = new StringBuilder();
    for (StringBuilder sb : rows) result.append(sb);
    return result.toString();
}
```

---

## Q4: Spiral Matrix

```
Input: n=3
Output:
1 2 3
8 9 4
7 6 5
```

```java
public static int[][] spiralMatrix(int n) {
    int[][] matrix = new int[n][n];
    int num = 1;
    int top = 0, bottom = n - 1, left = 0, right = n - 1;

    while (num <= n * n) {
        for (int j = left; j <= right; j++) matrix[top][j] = num++;
        top++;
        for (int i = top; i <= bottom; i++) matrix[i][right] = num++;
        right--;
        for (int j = right; j >= left; j--) matrix[bottom][j] = num++;
        bottom--;
        for (int i = bottom; i >= top; i--) matrix[i][left] = num++;
        left++;
    }

    return matrix;
}
```

---

## Q5: Matrix Rotation (90 degrees clockwise)

```
Input:
1 2 3
4 5 6
7 8 9

Output:
7 4 1
8 5 2
9 6 3
```

```java
/**
 * WHY: Asked in Google, Amazon interviews
 * HOW: Transpose + Reverse each row
 */
public static void rotate90(int[][] matrix) {
    int n = matrix.length;

    // Transpose
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }

    // Reverse each row
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n / 2; j++) {
            int temp = matrix[i][j];
            matrix[i][j] = matrix[i][n - 1 - j];
            matrix[i][n - 1 - j] = temp;
        }
    }
}
```

---

# 🎯 PATTERN PROBLEM SOLVING CHEAT SHEET

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PATTERN SOLVING FORMULAS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RIGHT TRIANGLE:  Row i → print (i+1) items, starting col=0                     │
│  LEFT TRIANGLE:   Row i → print (n-i) spaces, then (i+1) items                  │
│  PYRAMID:         Row i → print (n-i-1) spaces, then (2i+1) items               │
│  INVERTED:        Row i → print i spaces, then (2(n-i)-1) items                 │
│  DIAMOND:         Pyramid (0 to n-1) + Inverted Pyramid (n-2 to 0)              │
│  SANDGLASS:       Inverted (0 to n-1) + Pyramid (1 to n-1)                      │
│                                                                                  │
│  HOLLOW:          Print content only when:                                       │
│                   i==0 OR i==n-1 OR j==0 OR j==current_row_width-1              │
│                                                                                  │
│  NUMBER PATTERNS:                                                                │
│    Row number:     Print (i) for all columns                                    │
│    Column number:  Print (j) for all columns                                    │
│    Floyd's:        Use single counter (num++), don't reset                      │
│    Pascal's:       value = prev_value * (row - col) / col                       │
│                                                                                  │
│  CHARACTER PATTERNS:                                                             │
│    Convert: 'A' + index gives character                                         │
│    Wrap:    if (ch > 'Z') ch = 'A' or use '*'                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏋️ Practice Order for Feb 10, 2026

| Day   | Patterns        | Focus                    |
| ----- | --------------- | ------------------------ |
| Day 1 | 1-4             | Basic triangles          |
| Day 2 | 5-8             | Pyramids & Diamond       |
| Day 3 | 9-12            | Hollow patterns          |
| Day 4 | N1-N5           | Basic number patterns    |
| Day 5 | N6-N10          | Advanced number patterns |
| Day 6 | C1-C5           | Alphabet patterns        |
| Day 7 | S1-S5           | Special patterns         |
| Day 8 | Interview Q1-Q5 | Real interview problems  |

---

_Master patterns = Master loops = Master DSA_
