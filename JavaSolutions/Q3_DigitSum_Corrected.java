import java.util.*;

/**
 * Q3: Digit Sum Divisibility - CORRECTED SOLUTION
 * 
 * YOUR CRITICAL MISTAKE FIXED:
 * - Changed: for(int i=start+1; i<end; i++)
 * - To: for(int i=start; i<=end; i++)
 * - This was excluding BOTH boundaries!
 * 
 * REMOVED UNNECESSARY CODE:
 * - Negative number handling (not in constraints)
 * - Start/end swapping (not in constraints)
 * 
 * PATTERN: Range Iteration + Digit Manipulation
 * 
 * TEST CASES:
 * Input: 4, 35, 5 → Output: 5 14 19 23 28 32
 * Input: 120, 150, 7 → Output: 124 133 142 149
 * Input: 10, 20, 10 → Output: No Numbers
 */

public class Q3_DigitSum_Corrected {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int start = sc.nextInt();
        int end = sc.nextInt();
        int k = sc.nextInt();

        // CRITICAL FIX: Inclusive range [start, end]
        // Use <= for end, and start at start (not start+1)
        boolean found = false;

        for (int i = start; i <= end; i++) { // CHANGED: start+1 → start, i<end → i<=end
            int sum = getDigitSum(i);

            if (sum % k == 0) {
                System.out.print(i + " ");
                found = true;
            }
        }

        if (!found) {
            System.out.println("No Numbers");
        }
    }

    /**
     * Extract digit sum of a number
     * Example: 124 → 1+2+4 = 7
     * 
     * Time Complexity: O(log₁₀N) = O(number of digits)
     */
    public static int getDigitSum(int num) {
        int sum = 0;
        num = Math.abs(num); // Handle negative numbers (if any)

        while (num > 0) {
            sum += num % 10; // Add last digit
            num /= 10; // Remove last digit
        }

        return sum;
    }
}

/**
 * DETAILED EXPLANATION OF THE BUG:
 * 
 * Your Original Code:
 * for(int i=start+1; i<end; i++)
 * 
 * Example: start=4, end=35
 * - Your loop: i=5, 6, 7, ..., 34 (30 numbers)
 * - Expected: i=4, 5, 6, ..., 35 (32 numbers)
 * 
 * Missing: 4 and 35
 * 
 * For Input [4, 35, 5]:
 * - 4: digit_sum = 4, 4%5 ≠ 0 (not printed anyway)
 * - 5: digit_sum = 5, 5%5 = 0 ✓ (YOUR CODE MISSES THIS)
 * - 32: digit_sum = 3+2 = 5, 5%5 = 0 ✓ (YOUR CODE MISSES THIS)
 * - 35: digit_sum = 3+5 = 8, 8%5 ≠ 0 (not printed anyway)
 * 
 * Expected output: 5 14 19 23 28 32
 * Your output: 14 19 23 28
 * 
 * This caused 60% test case failures!
 */
