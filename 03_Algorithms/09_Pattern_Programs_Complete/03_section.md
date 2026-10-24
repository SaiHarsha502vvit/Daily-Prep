# ═══════════════════════════════════════════════════════════

> **Navigation**: [← ═══════════════════════════════════════════════════════════](02_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [═══════════════════════════════════════════════════════════ →](04_section.md)
> Page 3 of 6 in **Complete Pattern Programs - From Zero to Hero**


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

[← ═══════════════════════════════════════════════════════════](02_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md) | [═══════════════════════════════════════════════════════════ →](04_section.md)
