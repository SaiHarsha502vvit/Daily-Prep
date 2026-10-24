# Part 2 — Number Patterns (15 patterns)

> **Navigation**: [← Part 1 — Basic Star Patterns (15 patterns)](01_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [Part 3 — Character Patterns (10 patterns) →](03_section.md)
> Page 2 of 6 in **Complete Pattern Programs - From Zero to Hero**


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

[← Part 1 — Basic Star Patterns (15 patterns)](01_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [Part 3 — Character Patterns (10 patterns) →](03_section.md)
