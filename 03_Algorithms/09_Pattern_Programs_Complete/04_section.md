# Part 4 — Special Patterns (10 patterns)

> **Navigation**: [← Part 3 — Character Patterns (10 patterns)](03_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [Part 5 — Interview Pattern Questions →](05_section.md)
> Page 4 of 6 in **Complete Pattern Programs - From Zero to Hero**


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

[← Part 3 — Character Patterns (10 patterns)](03_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [Part 5 — Interview Pattern Questions →](05_section.md)
