# ═══════════════════════════════════════════════════════════

> **Navigation**: [← ═══════════════════════════════════════════════════════════](04_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [PATTERN PROBLEM SOLVING CHEAT SHEET →](06_solving_cheat_sheet.md)
> Page 5 of 6 in **Complete Pattern Programs - From Zero to Hero**


## Q1: Print Triangle with Custom Character

```
Input: n=4, char='#'
Output:


#
# #
# # #
# # # #
```

🔬 **Section Challenge — Q1: Print Triangle with Custom Character**

**Challenge 1 (Loop Reasoning):** For `n = 4` and `char = '#'`, how do you derive the nested loops instead of memorizing the pattern?

<details><summary>Trace, Reasoning & Debug</summary>

Trace the output row by row. Row `1` prints one character, row `2` prints two, and row `i` prints `i` characters. That gives the loop structure directly: outer loop `i = 1..n`, inner loop `j = 1..i`, print the character, then print a newline after each row.

The constraint lens is simple: if the pattern is triangular, one loop usually controls rows and the other loop depends on the row number. For `n <= 0`, print nothing or validate input depending on the problem statement.

</details>

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

[← ═══════════════════════════════════════════════════════════](04_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [PATTERN PROBLEM SOLVING CHEAT SHEET →](06_solving_cheat_sheet.md)
