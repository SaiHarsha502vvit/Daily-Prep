import java.util.*;

/**
 * Q2: First Negative in Window - COMPLETE SOLUTION
 * 
 * PATTERN: Fixed-Size Sliding Window
 * 
 * APPROACH: Brute Force (Easy to implement, sufficient for N < 10000)
 * - For each window starting position i
 * - Check window [i, i+k-1]
 * - Find first negative number
 * 
 * CRITICAL FORMULA:
 * - Number of windows = N - K + 1
 * - Loop condition: i <= n - k (INCLUSIVE)
 * 
 * TEST CASES:
 * Input: 5, [-8, 2, -3, -6, 10], 2 → Output: -8 -3 -3 -6
 * Input: 8, [12, -1, -7, 8, -15, 30, 16, 28], 3 → Output: -1 -1 -7 -15 -15
 * Input: 3, [1, 2, 3], 2 → Output: No Numbers
 */

public class Q2_SlidingWindow_Complete {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Input array size
        int n = sc.nextInt();

        // CONSTRAINT: Array size must be > 0
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }

        // Input array elements
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Input window size
        int k = sc.nextInt();

        // CONSTRAINT: Key value validation
        if (k <= 0 || k > n) {
            System.out.println("Invalid Key Value");
            return;
        }

        // Sliding Window Approach
        ArrayList<Integer> result = new ArrayList<>();
        boolean hasNegative = false;

        // CRITICAL: Loop goes from 0 to n-k (INCLUSIVE)
        // This ensures we process all N-K+1 windows
        for (int i = 0; i <= n - k; i++) {
            int firstNeg = 0; // Default: no negative found

            // Find first negative in current window [i, i+k-1]
            for (int j = i; j < i + k; j++) {
                if (arr[j] < 0) {
                    firstNeg = arr[j];
                    hasNegative = true;
                    break; // Found first negative, exit inner loop
                }
            }

            // Store result if negative found
            if (firstNeg != 0) {
                result.add(firstNeg);
            }
        }

        // Output
        if (!hasNegative) {
            System.out.println("No Numbers");
        } else {
            for (int val : result) {
                System.out.print(val + " ");
            }
        }
    }
}

/**
 * ALTERNATE SOLUTION: Using Deque (O(N) optimal)
 * 
 * For advanced students - uses double-ended queue to track indices
 * 
 * import java.util.*;
 * 
 * public class Q2_Optimized {
 * public static void main(String[] args) {
 * Scanner sc = new Scanner(System.in);
 * int n = sc.nextInt();
 * if (n <= 0) {
 * System.out.println("Invalid Input");
 * return;
 * }
 * 
 * int[] arr = new int[n];
 * for (int i = 0; i < n; i++) {
 * arr[i] = sc.nextInt();
 * }
 * 
 * int k = sc.nextInt();
 * if (k <= 0 || k > n) {
 * System.out.println("Invalid Key Value");
 * return;
 * }
 * 
 * Deque<Integer> deque = new LinkedList<>();
 * ArrayList<Integer> result = new ArrayList<>();
 * 
 * // First window
 * for (int i = 0; i < k; i++) {
 * if (arr[i] < 0) {
 * deque.add(i);
 * }
 * }
 * 
 * if (!deque.isEmpty()) {
 * result.add(arr[deque.peekFirst()]);
 * }
 * 
 * // Slide window
 * for (int i = k; i < n; i++) {
 * // Remove out-of-window elements
 * while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
 * deque.removeFirst();
 * }
 * 
 * // Add current element if negative
 * if (arr[i] < 0) {
 * deque.addLast(i);
 * }
 * 
 * // Store first negative
 * if (!deque.isEmpty()) {
 * result.add(arr[deque.peekFirst()]);
 * }
 * }
 * 
 * // Output
 * if (result.isEmpty()) {
 * System.out.println("No Numbers");
 * } else {
 * for (int val : result) {
 * System.out.print(val + " ");
 * }
 * }
 * }
 * }
 */
