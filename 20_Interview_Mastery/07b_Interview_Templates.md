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


---

## Reality Check

**"Templates let you solve without thinking"** — Templates encode a pattern's INVARIANT, and applying one to a problem that violates its assumptions produces silent wrong answers ([04_Patterns/02 Code_Templates]): the binary-search template on a non-monotonic predicate, the sliding-window template with the wrong shrink-policy ([05_Problem_Solving/05]), the template whose edge cases you did not check. "Solve without thinking" is the template-misuse — a template is scaffolding you instantiate WITH understanding (knowing why each line is there, checking the assumptions hold, handling the edges — the [04_Patterns/02] can-you-rederive-from-the-invariant), and applying it thoughtlessly is exactly how the memorizer fails on the mutated problem the interviewer designed to test understanding, which is why templates amplify understanding and cannot replace it.

**"A template that compiles and passes the sample is applied correctly"** — Sample inputs rarely hit the template's edges, and the edges are where instantiation errors live ([04_Patterns/02, 05_Problem_Solving/23]): the empty input, the single element, the all-duplicates, the answer-at-the-boundary (the [04_Patterns/02] canonical-edge-cases that break naive instantiations). "Compiles and passes the sample" is the false-confidence — every template has 2-3 canonical edges (the [04_Patterns/02] binary-search-two-elements, the window-larger-than-array) that the friendly sample avoids, and checking those edges before trusting the instantiation ([05_Problem_Solving/23] enumerate-edges-first) is the discipline, because the template that passes the sample and fails the empty-or-boundary case is the common interview wrong-answer that edge-checking would have caught.

**"More templates memorized means better prepared"** — A few templates deeply understood (rederivable from their invariants) beat many memorized shallowly ([04_Patterns/02, 04_Pattern-Recognition]): the over-generic template with six parameters that is harder to instantiate than three specialized ones ([04_Patterns/02] can-you-rewrite-in-60-seconds), the memorized template you cannot adapt when the problem twists. "More templates means better prepared" is the collection-trap — the [04_Patterns/02] bar is rederivable-from-the-invariant (understand it deeply enough to reconstruct and adapt), and a small set of deeply-understood templates transfers to variants while a large set of shallowly-memorized ones fails on the twist, which is why depth-of-understanding (the invariant, the edges, the adaptation) beats breadth-of-memorization for templates.

**"Templates are the same as understanding the pattern"** — A template is the CODE SHAPE; the pattern is the invariant and the recognition of when it applies ([04_Patterns/02, 04_Pattern-Recognition]): the template you can type versus the recognition of WHICH problems need it ([04_Pattern-Recognition]) and the understanding of WHY it works ([14_MM] why-over-what). "Same as understanding" conflates the artifact with the skill — the template is a memory-aid for the code shape of an understood pattern, and having the template without the recognition (which problems) and the understanding (why, and the edges) is the [04_Patterns/02] memorizer who transcribes the template onto a problem it no longer fits, which is why the interview-effective preparation is the pattern understanding (recognition + why + edges) that the template merely records the code-shape of.

**"Interview templates transfer directly to production code"** — Interview templates optimize for solving-under-time, and production code has different requirements the template ignores ([04_Patterns/02, clean-code, 13_DE]): the terse template variable names that production readability rejects ([13_DE clean-code, implementation-checklist naming]), the missing error handling and edge robustness that production requires ([13_DE production-code]), the concurrent-safety and the comparator-contracts ([04_Patterns/02] production-review-questions). "Transfer directly" misses that the interview template is a solve-fast artifact, and production code built from it needs the readability, the error handling, the robustness, and the operability that the template omits, which is why the [04_Patterns/02] framing is that a perfect algorithmic template still needs the production concerns (naming, errors, concurrency, contracts) added, and the template is the algorithmic core not the production-ready code.
