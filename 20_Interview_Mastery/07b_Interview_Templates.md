**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# Chapter 07 - Interview Templates & Debugger Harness

Purpose: Provide ready-to-copy competitive programming and interview code templates, featuring the classic UVa generic debugger harness for rapid local testing without interfering with standard output limits.

---

## 1. The UVa Generic Debugger Harness (Java)

When practicing problems from UVa Online Judge, Codeforces, or LeetCode hard challenges in a local IDE, standard `System.out.println()` statements are dangerous. If you forget to remove them, they pollute the standard output and cause **Wrong Answer (WA)**.

To solve this, we use the **Generic Debugger Harness** inspired by competitive programming veterans (like Steven Halim from CP3/CP4).

### The Strategy:

1. **Print to `System.err`**: Online judges ignore `stderr`. Even if you forget to remove the debug lines, you won't get a WA (though you might get a Time Limit Exceeded if you print millions of lines).
2. **`DEBUG` flag toggle**: A single `static final boolean DEBUG` can turn off all debug logic globally, saving performance.
3. **`Arrays.deepToString()`**: A magic Java method that recursively converts _any_ array (1D, 2D, Object arrays) into a readable JSON-like string.

### The Template

```java
import java.io.*;
import java.util.*;

public class Main {

    // =========================================================================
    // 1. UVa DEBUGGER HARNESS
    // =========================================================================

    // Toggle this to 'false' before submitting if performance is critical
    private static final boolean DEBUG = true;

    /**
     * Generic variadic debug printer.
     * Usage: debug("Matrix", dp, "Current Index", i, "Target", target);
     */
    private static void debug(Object... args) {
        if (DEBUG) {
            // Print to stderr (Standard Error) which is ignored by most judges' stdout checks
            System.err.println("👉 " + Arrays.deepToString(args));
        }
    }

    // =========================================================================
    // 2. FAST I/O READER (For UVa / Codeforces / HackerRank)
    // =========================================================================
    static class FastScanner {
        BufferedReader br;
        StringTokenizer st;

        public FastScanner() {
            br = new BufferedReader(new InputStreamReader(System.in));
        }

        String next() {
            while (st == null || !st.hasMoreElements()) {
                try {
                    String line = br.readLine();
                    if (line == null) return null; // EOF
                    st = new StringTokenizer(line);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            return st.nextToken();
        }

        int nextInt() { return Integer.parseInt(next()); }
        long nextLong() { return Long.parseLong(next()); }
        double nextDouble() { return Double.parseDouble(next()); }
        String nextLine() {
            String str = "";
            try {
                str = br.readLine();
            } catch (IOException e) {
                e.printStackTrace();
            }
            return str;
        }
    }

    // =========================================================================
    // 3. MAIN EXECUTION
    // =========================================================================
    public static void main(String[] args) {
        FastScanner sc = new FastScanner();
        // PrintWriter for fast output
        PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));

        /*
         * Example UVa problem flow:
         * int testCases = sc.nextInt();
         * while (testCases-- > 0) { ... }
         */

        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Debugging a 1D array
        debug("Input array:", arr);

        int[][] dp = new int[2][2];
        dp[1][1] = 42;

        // Debugging a 2D matrix magically
        debug("DP Matrix:", dp);

        out.println("Answer is " + 42);

        // CRITICAL: Always flush the PrintWriter!
        out.flush();
    }
}
```

### Why this is production-ready for interviews:

- Shows you understand **I/O performance** (`BufferedReader` + `PrintWriter` vs `Scanner` + `System.out`).
- Demonstrates **Defensive Coding** with a `DEBUG` toggle.
- Uses **Variadic arguments (`...`)** and `Arrays.deepToString()` to show deep knowledge of the Java standard library.
